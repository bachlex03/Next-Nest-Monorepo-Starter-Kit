export class UserCreatedDomainEvent {
  constructor(
    public readonly email: string,
    public readonly userName: string,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}
}
