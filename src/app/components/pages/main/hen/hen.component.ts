import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Hen } from '../../../../../model/Hen';
import { HenService } from '../../../../../service/hen.service';
import { Shed } from '../../../../../model/Shed';
import { ShedService } from '../../../../../service/shed.service';

@Component({
  selector: 'app-hen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hen.component.html',
})
export class HenComponent implements OnInit {
  gallinas: Hen[] = [];
  paginaGallinas: Hen[] = [];
  gallinaSeleccionada: Hen | null = null;
  mostrarModal: boolean = false;
  page: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  statusFilter: 'A' | 'I' = 'A';
  statusActive: boolean = true;
  nuevaGallina: Hen = { arrivalDate: new Date(), quantity: 0, status: 'A', shedId: 0 };
  mostrarModalAgregar: boolean = false;
  fechaBusqueda: string = '';
  
  // Added for shed integration
  sheds: Shed[] = [];
  shedNames: Map<number, string> = new Map();

  constructor(
    private henService: HenService,
    private shedService: ShedService // Add ShedService
  ) {}

  ngOnInit(): void {
    this.loadSheds();
    this.listarGallinas();
  }

  // Load all sheds
  loadSheds(): void {
    this.shedService.getAll().subscribe({
      next: (data) => {
        this.sheds = data.filter(shed => shed.status === 'A'); // Only active sheds
        // Create a map for quick lookup of shed names by ID
        this.sheds.forEach(shed => {
          this.shedNames.set(shed.id, shed.name);
        });
      },
      error: (err) => {
        console.error('Error loading sheds', err);
      }
    });
  }

  // Get shed name by ID
  getShedName(shedId: number): string {
    return this.shedNames.get(shedId) || 'No asignado';
  }

  // Rest of your existing methods...
  
  buscarGallinasPorFecha(): void {
    if (!this.fechaBusqueda) {
      console.warn('Seleccione una fecha válida.');
      this.listarGallinas();
      return;
    }
  
    this.henService.getHensByDate(this.fechaBusqueda).subscribe({
      next: (data) => {
        this.gallinas = data;
        this.filtrarGallinas();
      },
      error: (err) => {
        console.error('Error al buscar gallinas por fecha', err);
      },
    });
  }
  
  listarGallinas(): void {
    this.henService.getHens().subscribe({
      next: (data) => {
        this.gallinas = data;
        this.filtrarGallinas();
      },
      error: (err) => {
        console.error('Error al listar gallinas', err);
      },
    });
  }

  filtrarGallinas(): void {
    const filtradas = this.gallinas.filter(
      (gallina) => gallina.status === this.statusFilter
    );
    this.totalPages = Math.ceil(filtradas.length / this.itemsPerPage);
    this.updatePaginatedData(filtradas);
  }

  updatePaginatedData(filtradas: Hen[]): void {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginaGallinas = filtradas.slice(startIndex, endIndex);
  }

  toggleStatus(): void {
    this.statusFilter = this.statusFilter === 'A' ? 'I' : 'A';
    this.statusActive = !this.statusActive;
    this.page = 1;
    this.filtrarGallinas();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.filtrarGallinas();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.filtrarGallinas();
    }
  }
  
  abrirModalAgregar(): void {
    // Reset and initialize fields
    this.nuevaGallina = { 
      arrivalDate: new Date(), 
      quantity: 0, 
      status: 'A', 
      shedId: this.sheds.length > 0 ? this.sheds[0].id : 0 
    };
    this.mostrarModalAgregar = true;
  }
  
  guardarNuevaGallina(): void {
    this.nuevaGallina.status = 'A';
    this.nuevaGallina.arrivalDate = new Date(this.nuevaGallina.arrivalDate);
  
    this.henService.create(this.nuevaGallina).subscribe(() => {
      this.listarGallinas();
      this.cerrarModalAgregar();
    });
  }
  
  cerrarModalAgregar(): void {
    this.mostrarModalAgregar = false;
  }
  
  eliminarGallina(id: number): void {
    this.henService.delete(id).subscribe({
      next: () => {
        this.listarGallinas();
      },
      error: (err) => {
        console.error('Error al eliminar la gallina', err);
      },
    });
  }

  restaurarGallina(id: number): void {
    this.henService.activate(id).subscribe({
      next: () => {
        this.listarGallinas();
      },
      error: (err) => {
        console.error('Error al restaurar la gallina ', err);
      },
    });
  }

  editarGallina(hen: Hen): void {
    this.gallinaSeleccionada = { ...hen };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.gallinaSeleccionada = null;
  }

  guardarEdicion(): void {
    if (!this.gallinaSeleccionada) return;

    this.henService.update(this.gallinaSeleccionada).subscribe({
      next: () => {
        this.gallinas = this.gallinas.map((gallina) =>
          gallina.id === this.gallinaSeleccionada!.id ? { ...this.gallinaSeleccionada! } : gallina
        );
        this.filtrarGallinas();
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al actualizar gallina', err);
      },
    });
  }

  toggleGallina(id: number, status: 'A' | 'I'): void {
    if (status === 'A') {
      this.eliminarGallina(id);
    } else {
      this.restaurarGallina(id);
    }
  }
}