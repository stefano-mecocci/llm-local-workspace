import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { BarsIcon, TimesIcon } from 'primeng/icons';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, BarsIcon, TimesIcon]
})
export class Sidebar {
  readonly open = signal(true);

  close() {
    this.open.set(false);
  }

  show() {
    this.open.set(true);
  }
}
