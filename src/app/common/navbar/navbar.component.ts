import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  menuOpen = false;
  userMenuOpen = false;
  
  // Para comunicar con el sidebar
  sidebarOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }
  
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    // Emitir evento para el componente sidebar
    this.emitSidebarToggle();
  }
  
  // Método para emitir el evento de cambio de sidebar
  private emitSidebarToggle() {
    // Puedes usar un servicio para comunicar entre componentes
    // O EventEmitter si los componentes están relacionados por padre/hijo
    const event = new CustomEvent('sidebar-toggle', { 
      detail: { isOpen: this.sidebarOpen } 
    });
    window.dispatchEvent(event);
  }

  logout() {
    console.log("Cerrar sesión");
    // Implementar lógica de cierre de sesión
  }
}