import { Module } from '@nestjs/common'
import { EmrFormService } from './emr-form.service'
import { EmrFormController } from './emr-form.controller'

@Module({
  controllers: [EmrFormController],
  providers: [EmrFormService],
})
export class EmrFormModule {}
