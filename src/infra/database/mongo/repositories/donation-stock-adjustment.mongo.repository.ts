import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DonationStockAdjustment,
  DonationStockAdjustmentWithEmployee,
} from '@/domain/entities';
import {
  CreateDonationStockAdjustmentData,
  DonationStockAdjustmentRepository,
} from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { DonationStockAdjustmentDoc } from '../schemas';
import { toEntity } from '../mappers/to-entity';
import { resolveMongoSession } from '../mongo-transaction-manager';

@Injectable()
export class DonationStockAdjustmentMongoRepository extends DonationStockAdjustmentRepository {
  constructor(
    @InjectModel(DonationStockAdjustmentDoc.name)
    private readonly model: Model<DonationStockAdjustmentDoc>
  ) {
    super();
  }

  async create(
    data: CreateDonationStockAdjustmentData,
    ctx?: TransactionContext
  ): Promise<DonationStockAdjustment> {
    const session = resolveMongoSession(ctx);
    const [created] = await this.model.create([data], { session });
    return toEntity<DonationStockAdjustment>(created);
  }

  async findByDonation(
    donationId: string
  ): Promise<DonationStockAdjustmentWithEmployee[]> {
    const docs = await this.model.aggregate([
      { $match: { id_donation: donationId } },
      { $sort: { created_at: -1 } },
      {
        $lookup: {
          from: 'employees',
          localField: 'id_employee',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: {
          path: '$employee',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    return docs.map((doc) => {
      const item = toEntity<any>(doc);
      if (item.employee) {
        const emp = toEntity<any>(item.employee);
        item.employee = {
          id: emp.id,
          name: emp.name,
          surname: emp.surname,
          role: emp.role,
        };
      }
      return item as DonationStockAdjustmentWithEmployee;
    });
  }
}
