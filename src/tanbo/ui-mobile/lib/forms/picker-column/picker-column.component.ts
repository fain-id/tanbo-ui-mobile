import { Component, Input, Inject, Output, EventEmitter, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import BScroll, { Position } from 'better-scroll';
import { Subscription } from 'rxjs';

import { PickerService, PickerCell } from '../picker/picker.service';

@Component({
  selector: 'ui-picker-column',
  templateUrl: './picker-column.component.html'
})
export class PickerColumnComponent implements AfterViewInit, OnDestroy {
  @Output() uiSelected = new EventEmitter<PickerCell>();
  @Input() cells: Array<PickerCell> = [];
  @Input() cellHeight: number = 36;
  @Input() value: PickerCell;

  distanceTop: number = 0;

  private scrollInstance: BScroll;
  private subs: Array<Subscription> = [];

  constructor(private elementRef: ElementRef,
              private pickerService: PickerService) {
  }

  ngAfterViewInit() {
    this.initScroll();
    this.subs.push(this.pickerService.onShow.subscribe(() => {
      if (this.scrollInstance) {
        let selectedIndex: number = 0;
        for (let i = 0; i < this.cells.length; i++) {
          if (this.cells[i].value === this.value.value) {
            selectedIndex = i;
            break;
          }
        }

        this.scrollInstance.scrollTo(0, -selectedIndex * (this.cellHeight));
        this.scrollInstance.refresh();
        return;
      }
      this.initScroll();
    }));
  }

  initScroll() {
    this.scrollInstance = new BScroll(this.elementRef.nativeElement, {
      wheel: {
        selectedIndex: 0,
        rotate: 0,
        adjustTime: 400,
        wheelWrapperClass: 'ui-picker-column',
        wheelItemClass: 'ui-picker-cell'
      }
    });
    this.scrollInstance.on('scrollStart', () => {
      this.pickerService.scroll(true);
    });
    this.scrollInstance.on('scrollEnd', (position: Position) => {
      this.pickerService.scroll(false);
      const value = this.cells[Math.abs(position.y / (this.cellHeight))];
      if (value.disabled) {
        return;
      }
      this.uiSelected.emit(value);
    });
  }

  ngOnDestroy() {
    if (this.scrollInstance) {
      this.scrollInstance.destroy();
    }
    this.subs.forEach(item => item.unsubscribe());
  }

}
