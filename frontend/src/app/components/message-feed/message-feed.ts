import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-message-feed',
  templateUrl: './message-feed.html',
  styleUrl: './message-feed.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageFeed {}
