import { Global, Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Global()
@Module({
  imports: [
    ElasticsearchModule.register({
      node: 'http://localhost:9200',
    }),
  ],
  exports: [ElasticsearchModule],
})
export class ElasticModule {}
