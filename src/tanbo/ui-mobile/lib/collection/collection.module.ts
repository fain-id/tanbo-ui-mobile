import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UITouchModule } from '../touch/touch.module';

import { CollectionComponent } from './collection/collection.component';
import { CollectionItemComponent } from './collection-item/collection-item.component';

@NgModule({
  imports: [
    CommonModule,
    UITouchModule
  ],
  declarations: [
    CollectionComponent,
    CollectionItemComponent
  ],
  exports: [
    CollectionComponent,
    CollectionItemComponent
  ]
})
export class UICollectionModule {
}