export default interface UserRepository {
  findByEmail(email: string): Promise<any>;
}
