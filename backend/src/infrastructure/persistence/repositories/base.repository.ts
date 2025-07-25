import { PrismaClient } from '@prisma/client'

export default abstract class BaseRepository<Entity> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected modelName: string,
  ) {}

  get model() {
    return this.prisma[this.modelName]
  }

  async findAll(): Promise<Array<Entity>> {
    try {
      return this.model.findMany()
    } catch (error) {
      throw new Error(error)
    }
  }

  async findById(id: string | number): Promise<Entity | null> {
    try {
      return await this.model.findUnique({
        where: { id },
      })
    } catch (error) {
      throw new Error(error)
    }
  }

  async create<T extends Partial<Entity>>(entity: T): Promise<Entity> {
    try {
      return await this.model.create({ data: entity })
    } catch (error) {
      throw new Error(error)
    }
  }

  // async deleteById(id: string | number): Promise<void> {
  //   try {
  //     await this.model.delete({ where: { id } })
  //   } catch (error) {
  //     throw new Error(error)
  //   }
  // }

  // async updateById(id: string | number, entity: Entity): Promise<Entity> {
  //   try {
  //     return await this.model.update({ where: { id }, data: entity })
  //   } catch (error) {
  //     throw new Error(error)
  //   }
  // }
}
