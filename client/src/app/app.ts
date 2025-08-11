import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('client');

  ngOnInit() {
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(data => console.log('CORS check:', data))
      .catch(err => console.error('CORS error:', err));
  }
}
