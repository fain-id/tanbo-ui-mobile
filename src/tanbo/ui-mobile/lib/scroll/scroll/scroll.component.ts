import {
  Component,
  ElementRef,
  HostBinding,
  Input,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2
} from '@angular/core';
import { Subscription } from 'rxjs';

import { PullUpLoadController, UI_DO_LOAD_DISTANCE } from './pull-up-load-controller';
import { PullDownRefreshController } from '../refresher/pull-down-refresh-controller';

@Component({
  selector: 'ui-scroll',
  templateUrl: './scroll.component.html'
})
export class ScrollComponent implements OnDestroy, OnInit {
  @HostBinding('style.paddingTop') paddingTop: string;
  // 是否开启下拉刷新
  @Input()
  set openRefresh(value: boolean) {
    this._openRefresh = value;
    if (value && !this.isBindRefresh) {
      this.bindingRefresher();
      this.isBindRefresh = true;
    }
  }

  get openRefresh() {
    return this._openRefresh;
  }

  // 是否开启下拉刷新
  @Input()
  set openInfinite(value: boolean) {
    this._openInfinite = value;
    if (value && !this.isBindInfinite) {
      this.bindingInfinite();
      this.isBindInfinite = true;
    }
  }

  get openInfinite() {
    return this._openInfinite;
  }

  private sub: Subscription;
  private distanceY: number = 0;
  private unBindFnList: Array<() => void> = [];

  private _openRefresh: boolean = false;
  private _openInfinite: boolean = false;

  private isBindRefresh: boolean = false;
  private isBindInfinite: boolean = false;

  constructor(private renderer: Renderer2,
              private elementRef: ElementRef,
              @Inject(UI_DO_LOAD_DISTANCE) private doLoadDistance: number,
              public pullUpLoadController: PullUpLoadController,
              public pullDownRefreshController: PullDownRefreshController) {

  }

  ngOnInit() {
    this.sub = this.pullDownRefreshController.onStateChange.subscribe(n => {
      this.distanceY = n;
      this.paddingTop = `${n}px`;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.unBindFnList.forEach(item => item());
  }

  bindingInfinite() {
    const element = this.elementRef.nativeElement;

    this.unBindFnList.push(this.renderer.listen(element, 'scroll', () => {
      if (!this.openInfinite) {
        return;
      }
      // 计算最大滚动距离
      const maxScrollY = Math.max(element.scrollHeight, element.offsetHeight) - element.offsetHeight;
      // 如果当前滚动距离小于上拉刷新临界值，则记录相应值，并就广播相应事件
      if (maxScrollY - element.scrollTop < this.doLoadDistance) {
        this.pullUpLoadController.loading();
      }
    }));
  }

  bindingRefresher() {
    const element = this.elementRef.nativeElement;

    const fn = this.renderer.listen(element, 'touchstart', (ev: any) => {
      if (!this.openRefresh) {
        return;
      }
      const startPoint = ev.touches[0];
      const startX = startPoint.pageX;
      const startY = startPoint.pageY;

      let oldY = startY;
      let unBindTouchMoveFn: () => void;
      let unBindTouchEndFn: () => void;
      let unBindTouchCancelFn: () => void;

      const unBindFn = () => {
        unBindTouchMoveFn();
        unBindTouchEndFn();
        unBindTouchCancelFn();
        this.pullDownRefreshController.dragEnd();
      };

      let isFirstTouching: boolean = true;

      unBindTouchMoveFn = this.renderer.listen(element, 'touchmove', (moveEvent: any) => {
        const movePoint = moveEvent.touches[0];
        const moveX = movePoint.pageX;
        const moveY = movePoint.pageY;

        if (Math.abs(moveX - startX) > Math.abs(moveY - startY) && isFirstTouching) {
          unBindFn();
          return;
        }
        isFirstTouching = false;

        const n = moveY - oldY;

        oldY = moveY;

        if (n < 0) {
          // 上拉
          if (this.distanceY > 0) {
            this.pullDownRefreshController.drag(n / 2 + this.distanceY);
            return false;
          }
        } else if (element.scrollTop <= 0) {
          // 下拉
          this.pullDownRefreshController.drag(n / 2 + this.distanceY);
        }
      });

      unBindTouchEndFn = this.renderer.listen(element, 'touchend', unBindFn);
      unBindTouchCancelFn = this.renderer.listen(element, 'touchcancel', unBindFn);
    });

    this.unBindFnList.push(fn);
  }
}