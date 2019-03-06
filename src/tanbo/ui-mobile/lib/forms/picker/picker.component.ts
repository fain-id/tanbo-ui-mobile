import { Component, Input, Output, EventEmitter, HostListener, OnInit, OnDestroy, Inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';

import { PickerService, PickerCell } from './picker.service';
import { UI_SELECT_ARROW_CLASSNAME, inputAttrToBoolean } from '../helper';

@Component({
  selector: 'ui-picker',
  templateUrl: './picker.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: PickerComponent,
    multi: true
  },
    PickerService
  ]
})
export class PickerComponent implements ControlValueAccessor, OnDestroy, OnInit {
  @Output() uiChange = new EventEmitter<Array<PickerCell>>();
  @Input() name: string;
  @Input() arrowIconClassName: string = '';
  @Input() columnSize: number = 3;
  @Input() placeholder: string = '';
  @Input() forId: string;
  @Input() value: Array<PickerCell> = [];
  @Input() title: string = '';

  @Input()
  set disabled(isDisabled: any) {
    this._disabled = inputAttrToBoolean(isDisabled);
  }

  get disabled() {
    return this._disabled;
  }

  @Input()
  set readonly(isReadonly: any) {
    this._readonly = inputAttrToBoolean(isReadonly);
  }

  get readonly() {
    return this._readonly;
  }

  @Input()
  set data(list: Array<PickerCell>) {
    this._data = list;
    if (this.value.length >= this.columnSize) {
      this.value.forEach(item => this._value.push(item));
      this.makeList(0, list);
    } else {
      this.list.push(list);
      if (list.length) {
        this.cellSelected(list[0], 0);
      }
    }
  }

  get data() {
    return this._data;
  }

  focus: boolean = false;
  list: Array<Array<PickerCell>> = [];

  private _data: Array<PickerCell>;
  private _value: Array<PickerCell> = [];
  private onChange: (_: any) => void;
  private onTouched: (_: any) => void;
  private _disabled: boolean = false;
  private _readonly: boolean = false;
  private timer: any = null;

  private sub: Subscription;
  private isScrolling: boolean = false;

  constructor(@Inject(UI_SELECT_ARROW_CLASSNAME) arrowIcon: string,
              private pickerService: PickerService) {
    this.arrowIconClassName = arrowIcon;
  }

  ngOnInit() {
    this.sub = this.pickerService.onScroll.subscribe(b => {
      this.isScrolling = b;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  @HostListener('click')
  click() {
    clearTimeout(this.timer);
    if (this.disabled || this.readonly) {
      return;
    }

    this.focus = true;
    this.timer = setTimeout(() => {
      this.pickerService.show();
    });
  }

  hide() {
    clearTimeout(this.timer);
    this.focus = false;
  }

  cellSelected(cell: PickerCell, index: number) {
    this._value[index] = cell;
    this._value.length = index + 1;
    let children = cell.children;
    let i = index;
    while (children) {
      this._value[++i] = children[0];
      children = children[0].children;
    }
    this.makeList(index + 1, cell.children);
  }

  selected() {
    if (!this.focus || this.isScrolling) {
      return;
    }
    if (this.onChange) {
      this.onChange(this._value);
    }
    if (this.onTouched) {
      this.onTouched(this._value);
    }
    this.value = this._value;
    this.uiChange.emit(this._value);
    this.hide();
  }

  writeValue(value: Array<PickerCell>) {
    this.value = value;
    if (value && Array.isArray(value)) {
      this.value.forEach(item => this._value.push(item));
      this.makeList(0, this._data);
    }
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  private makeList(startIndex: number, list?: Array<PickerCell>) {
    this.list.length = startIndex;
    if (list) {
      const fn = (parentList: Array<PickerCell>, child: Array<PickerCell>, index: number) => {
        this.list.push(child);
        parentList.forEach(item => {
          if (this._value[index] && item.value === this._value[index].value && item.children) {
            const nextChild: Array<PickerCell> = [];
            fn(item.children, nextChild, index + 1);
          }
          child.push(item);
        });
      };

      fn(list, [], startIndex);
    }

    this.completionListLength();
  }

  private completionListLength() {
    for (let i = this.list.length; i < this.columnSize; i++) {
      this.list.push([]);
    }
  }
}