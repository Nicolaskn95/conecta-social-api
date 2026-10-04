import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DashboardDonationRow,
  DashboardEmployeeRow,
  DashboardEventRow,
  DashboardFamilyRow,
  DashboardRepository,
  DashboardSource,
} from '@/domain/repositories';
import {
  CategoryDoc,
  DonationDoc,
  EmployeeDoc,
  EventDoc,
  FamilyDoc,
} from '../schemas';
import { toEntity } from '../mappers/to-entity';

@Injectable()
export class DashboardMongoRepository extends DashboardRepository {
  constructor(
    @InjectModel(FamilyDoc.name)
    private readonly familyModel: Model<FamilyDoc>,
    @InjectModel(EmployeeDoc.name)
    private readonly employeeModel: Model<EmployeeDoc>,
    @InjectModel(EventDoc.name)
    private readonly eventModel: Model<EventDoc>,
    @InjectModel(DonationDoc.name)
    private readonly donationModel: Model<DonationDoc>,
    @InjectModel(CategoryDoc.name)
    private readonly categoryModel: Model<CategoryDoc>
  ) {
    super();
  }

  async getOverviewSource(): Promise<DashboardSource> {
    const [rawFamilies, rawEmployees, rawEvents, rawDonations] =
      await Promise.all([
        this.familyModel
          .find(
            { active: true },
            {
              _id: 1,
              name: 1,
              city: 1,
              neighborhood: 1,
              created_at: 1,
            }
          )
          .lean()
          .exec(),
        this.employeeModel
          .find({ active: true }, { _id: 1, role: 1 })
          .lean()
          .exec(),
        this.eventModel
          .find(
            { active: true },
            {
              _id: 1,
              name: 1,
              city: 1,
              date: 1,
              status: 1,
              attendance: 1,
              created_at: 1,
            }
          )
          .lean()
          .exec(),
        this.donationModel.aggregate([
          { $match: { active: true } },
          {
            $lookup: {
              from: 'categories',
              localField: 'category_id',
              foreignField: '_id',
              as: 'category',
            },
          },
          {
            $unwind: {
              path: '$category',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              donator_name: 1,
              current_quantity: 1,
              available: 1,
              created_at: 1,
              updated_at: 1,
              category: {
                name: '$category.name',
                measure_unity: '$category.measure_unity',
              },
            },
          },
        ]),
      ]);

    const families: DashboardFamilyRow[] = rawFamilies.map((f) => ({
      id: String(f._id),
      name: f.name,
      city: f.city,
      neighborhood: f.neighborhood,
      created_at: f.created_at,
    }));

    const employees: DashboardEmployeeRow[] = rawEmployees.map((e) => ({
      id: String(e._id),
      role: e.role,
    }));

    const events: DashboardEventRow[] = rawEvents.map((ev) => ({
      id: String(ev._id),
      name: ev.name,
      city: ev.city,
      date: ev.date,
      status: ev.status,
      attendance: ev.attendance,
      created_at: ev.created_at,
    }));

    const donations: DashboardDonationRow[] = rawDonations.map((d) => {
      const item = toEntity<any>(d);
      return {
        id: item.id,
        name: item.name,
        donator_name: item.donator_name,
        current_quantity: item.current_quantity,
        available: item.available,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: {
          name: item.category?.name ?? 'Não categorizado',
          measure_unity: item.category?.measure_unity ?? 'UN',
        },
      };
    });

    return {
      families,
      employees,
      events,
      donations,
    };
  }
}
