import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee } from '@/domain/entities';
import { EmployeeRole } from '@/domain/enums';
import {
  CreateEmployeeData,
  EmployeeRepository,
  UpdateEmployeeData,
} from '@/domain/repositories';
import { EmployeeDoc } from '../schemas';
import { toEntity, toEntityList } from '../mappers/to-entity';

@Injectable()
export class EmployeeMongoRepository extends EmployeeRepository {
  constructor(
    @InjectModel(EmployeeDoc.name)
    private readonly employeeModel: Model<EmployeeDoc>
  ) {
    super();
  }

  async create(
    data: CreateEmployeeData,
    hashedPassword: string
  ): Promise<Employee> {
    const created = await this.employeeModel.create({
      ...data,
      birth_date: new Date(data.birth_date),
      email: data.email.toLowerCase(),
      password: hashedPassword,
      active: data.active ?? true,
    });
    return toEntity<Employee>(created);
  }

  async findAll(): Promise<Employee[]> {
    const docs = await this.employeeModel.find().lean().exec();
    return toEntityList<Employee>(docs);
  }

  async findAllActives(role?: EmployeeRole): Promise<Employee[]> {
    const filter: any = { active: true };
    if (role) {
      filter.role = role;
    }
    const docs = await this.employeeModel.find(filter).lean().exec();
    return toEntityList<Employee>(docs);
  }

  async findById(id: string): Promise<Employee | null> {
    const doc = await this.employeeModel.findById(id).lean().exec();
    return doc ? toEntity<Employee>(doc) : null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const doc = await this.employeeModel
      .findOne({ email: email.toLowerCase() })
      .lean()
      .exec();
    return doc ? toEntity<Employee>(doc) : null;
  }

  async findByCpf(cpf: string): Promise<Employee | null> {
    const doc = await this.employeeModel.findOne({ cpf }).lean().exec();
    return doc ? toEntity<Employee>(doc) : null;
  }

  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    const updatePayload: any = { ...data };
    if (data.birth_date) {
      updatePayload.birth_date = new Date(data.birth_date);
    }
    if (data.email) {
      updatePayload.email = data.email.toLowerCase();
    }

    const updated = await this.employeeModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
      .lean()
      .exec();
    return toEntity<Employee>(updated);
  }

  async softDelete(id: string): Promise<Employee> {
    const updated = await this.employeeModel
      .findByIdAndUpdate(id, { $set: { active: false } }, { new: true })
      .lean()
      .exec();
    return toEntity<Employee>(updated);
  }

  async findPaginated(
    skip: number,
    take: number,
    role?: EmployeeRole
  ): Promise<Employee[]> {
    const filter: any = { active: true };
    if (role) {
      filter.role = role;
    }
    const docs = await this.employeeModel
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(take)
      .lean()
      .exec();
    return toEntityList<Employee>(docs);
  }

  async countActives(role?: EmployeeRole): Promise<number> {
    const filter: any = { active: true };
    if (role) {
      filter.role = role;
    }
    return this.employeeModel.countDocuments(filter).exec();
  }
}
