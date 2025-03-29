import { IUser } from 'src/core/privateUser';

export interface IEvent {
  id?: number;
  title: string;
  eventDate: Date;
  cep: string;
  address: string;
  state: string;
  number: number;
  embedPostInstagram: string;
  userId: IUser['id'];
}
