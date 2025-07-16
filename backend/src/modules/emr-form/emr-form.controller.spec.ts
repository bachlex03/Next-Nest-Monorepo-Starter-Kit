import { Test, TestingModule } from '@nestjs/testing'
import { EmrFormController } from './emr-form.controller'
import { EmrFormService } from './emr-form.service'

describe('EmrFormController', () => {
  let controller: EmrFormController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmrFormController],
      providers: [EmrFormService],
    }).compile()

    controller = module.get<EmrFormController>(EmrFormController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
