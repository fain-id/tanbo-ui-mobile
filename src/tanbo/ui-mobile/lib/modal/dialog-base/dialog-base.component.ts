import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ui-dialog-base',
  templateUrl: './dialog-base.component.html'
})
export class DialogBaseComponent {
  @Output() uiHide = new EventEmitter<void>();

  @Input()
  set show(value: boolean) {
    this._show = value;
    if (value) {
      this.display = true;
    }
  }

  get show() {
    return this._show;
  }

  display: boolean = false;

  private _show: boolean = false;

  animationEnd() {
    this.uiHide.emit();
    this.display = false;
  }

  hide() {
    if (!this.show) {
      this.display = false;
    }
  }
}