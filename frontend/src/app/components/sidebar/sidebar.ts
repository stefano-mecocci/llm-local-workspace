import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
