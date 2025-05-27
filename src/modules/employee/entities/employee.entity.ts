export class EmployeeEntity {
  id: string;
  name: string;
  surname: string;
  email: string;
  cpf: string;
  phone: string;
  role: string;
  birth_date: Date;
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  city: string;
  uf: string;
  state: string;
  complement?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
