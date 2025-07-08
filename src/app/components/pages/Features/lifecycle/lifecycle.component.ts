import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CicloVida } from './../../../../../model/Lifecycle';
import { CicloVidaService } from '../../../../../service/lifecycle.service';
import { HenService } from './../../../../../service/hen.service';

@Component({
  selector: 'app-lifecycle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lifecycle.component.html',
})
export class LifecycleComponent implements OnInit {
  ciclos: CicloVida[] = [];
  paginaCiclos: CicloVida[] = [];
  cicloSeleccionado: CicloVida | null = null;
  mostrarModal: boolean = false;
  mostrarModalDetalle: boolean = false;
  cicloDetalle: any = null;
  page: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 0;
  statusFilter: 'A' | 'I' = 'A';
  statusActive: boolean = true;
  nuevoCiclo: CicloVida = { henId: 0, typeIto: '', nameIto: '', typeTime: '', timesInWeeks: '', times: 0, status: 'A' }; // El id y endDate se generan en el backend
  mostrarModalCrear: boolean = false;
  mostrarModalEdicion: boolean = false;
  tipoBusqueda: string = '';
  hens: any[] = [];

  constructor(
    private cicloVidaService: CicloVidaService,
    private henService: HenService // Inyectamos el servicio de Hen
  ) { }

  ngOnInit(): void {
    this.listarCiclos();
    this.getHens(); // <- Añades esto
  }
  getHens() {
    this.henService.getHens().subscribe(data => {
      this.hens = data;
      console.log('Datos de galpones cargados:', this.hens);
    });
  }
  abrirModalCrear(): void {
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
    this.nuevoCiclo = { henId: 0, typeIto: '', nameIto: '', typeTime: '', timesInWeeks: '', times: 0, status: 'A' }; // Resetear
  }

  crearCiclo(): void {
    this.cicloVidaService.create(this.nuevoCiclo).subscribe({
      next: (data) => {
        this.listarCiclos(); // Recargar la lista de ciclos
        this.cerrarModalCrear(); // Cerrar el modal
      },
      error: (err) => {
        console.error('Error al crear ciclo', err);
      },
    });
  }

  listarCiclos(): void {
    this.cicloVidaService.getCycles().subscribe({
      next: (data) => {
        this.ciclos = data;
        this.filtrarCiclos();
      },
      error: (err) => {
        console.error('Error al listar ciclos', err);
      },
    });
  }

  filtrarCiclos(): void {
    const filtradas = this.ciclos.filter(ciclo => ciclo.status === this.statusFilter);
    this.totalPages = Math.ceil(filtradas.length / this.itemsPerPage);
    this.updatePaginatedData(filtradas);
  }

  updatePaginatedData(filtradas: CicloVida[]): void {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginaCiclos = filtradas.slice(startIndex, endIndex);
  }

  toggleStatus(): void {
    this.statusFilter = this.statusFilter === 'A' ? 'I' : 'A';
    this.statusActive = !this.statusActive;
    this.page = 1;
    this.filtrarCiclos();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.filtrarCiclos();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.filtrarCiclos();
    }
  }

  eliminarCiclo(id: number): void {
    this.cicloVidaService.delete(id).subscribe({
      next: () => {
        window.location.reload();
      },
      error: (err) => {
        console.error('Error al eliminar el ciclo', err);
      },
    });
  }
  verCiclo(ciclo: any) {
    console.log("Detalles del ciclo:", ciclo);
    // Aquí puedes abrir un modal o mostrar más detalles según necesites.
  }
  
  restaurarCiclo(id: number): void {
    this.cicloVidaService.activate(id).subscribe({
      next: () => {
        window.location.reload();
      },
      error: (err) => {
        console.error('Error al restaurar el ciclo', err);
      },
    });
  }
  abrirModalDetalle(ciclo: any) {
    this.cicloDetalle = ciclo;
    this.mostrarModalDetalle = true;
  
    if (ciclo.henId) {
      this.henService.getHenById(ciclo.henId).subscribe((hen: any) => {
        this.cicloDetalle.arrivalDate = hen.arrivalDate; // Agregamos arrivalDate
      });
    }
  }
  
  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.cicloDetalle = null;
  }
  editarCiclo(ciclo: CicloVida): void {
    this.cicloSeleccionado = { ...ciclo }; // Clonamos el objeto para evitar modificar directamente la lista
    this.mostrarModal = true; // Abre el modal
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cicloSeleccionado = null; // Resetea la selección
  }
  

  guardarEdicion(): void {
    if (!this.cicloSeleccionado) return;

    this.cicloVidaService.update(this.cicloSeleccionado).subscribe({
      next: () => {
        // Recargar toda la lista de ciclos después de la edición
        this.listarCiclos();
        this.cerrarModal(); // Cerrar modal después de guardar
      },
      error: (err) => {
        console.error('Error al actualizar ciclo', err);
      }
    });
  }
  
 // Método para buscar ciclos por tipo (typeIto)
 buscarCicloPorTipo(): void {
  if (!this.tipoBusqueda) {
    console.warn('Seleccione un tipo de búsqueda válido.');
    // Si el campo está vacío, puedes llamar a listarCiclos() o manejar el caso según sea necesario
    this.listarCiclos();
    return;
  }

  // Llamamos al servicio para obtener los ciclos por tipo
  this.cicloVidaService.getCiclosByTypeIto(this.tipoBusqueda).subscribe({
    next: (data: CicloVida[]) => {
      this.ciclos = data; // Asignamos los datos obtenidos
      this.filtrarCiclos(); // Actualizamos la vista
    },
    error: (err) => {
      console.error('Error al buscar ciclos por tipo', err);
    }
  });
}
  toggleCiclo(id: number, status: 'A' | 'I'): void {
    if (status === 'A') {
      this.eliminarCiclo(id);
    } else {
      this.restaurarCiclo(id);
    }
  }
}