import { Component, OnInit } from '@angular/core';
import { UbigeoService } from '../../../../../service/ubigeo.service';
import { Ubigeo } from '../../../../../model/Ubigeo';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css'],
})
export class LocationComponent implements OnInit {
  ubicaciones: Ubigeo[] = [];
  paginatedUbicaciones: Ubigeo[] = [];
  page: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 0;
  statusFilter: 'A' | 'I' = 'A';
  statusActive: boolean = true;
  isModalOpen = false;
  editMode = false;
  ubigeoForm: FormGroup;

  constructor(private ubigeoService: UbigeoService, private fb: FormBuilder) {
    this.ubigeoForm = this.fb.group({
      id: [null],
      country: ['', Validators.required],
      department: [''],
      province: [''],
      district: [''],
      status: ['A'],
    });
  }

  ngOnInit(): void {
    this.listarUbicaciones();
    this.adjustItemsPerPage();
    // Escuchar cambios de tamaño de pantalla
    window.addEventListener('resize', () => {
      this.adjustItemsPerPage();
    });
  }

  // Ajustar elementos por página según tamaño de pantalla
  adjustItemsPerPage(): void {
    if (window.innerWidth < 768) { // Móvil
      this.itemsPerPage = 4;
    } else {
      this.itemsPerPage = 6;
    }
    this.page = 1; // Reiniciar a la primera página
    if (this.ubicaciones.length > 0) {
      this.filtrarUbicaciones();
    }
  }

  listarUbicaciones(): void {
    this.ubigeoService.listarTodos().subscribe({
      next: (data) => {
        this.ubicaciones = data;
        this.filtrarUbicaciones();
      },
      error: (err) => {
        console.error('Error al listar ubicaciones:', err);
        this.mostrarError('Error al cargar las ubicaciones');
      },
    });
  }

  filtrarUbicaciones(): void {
    const ubicacionesFiltradas = this.ubicaciones.filter((u) => u.status === this.statusFilter);
    this.totalPages = Math.ceil(ubicacionesFiltradas.length / this.itemsPerPage);
    this.paginatedUbicaciones = ubicacionesFiltradas.slice(
      (this.page - 1) * this.itemsPerPage, 
      this.page * this.itemsPerPage
    );
    
    // Asegurar que la página actual sea válida
    if (this.page > this.totalPages && this.totalPages > 0) {
      this.page = this.totalPages;
      this.filtrarUbicaciones();
    }
  }

  abrirModal(): void {
    this.editMode = false;
    this.ubigeoForm.reset({ status: 'A' });
    this.isModalOpen = true;
  }

  editarUbicacion(ubicacion: Ubigeo): void {
    this.editMode = true;
    this.ubigeoForm.patchValue(ubicacion);
    this.isModalOpen = true;
  }

  cerrarModal(): void {
    this.isModalOpen = false;
  }

  guardarUbicacion(): void {
    if (this.ubigeoForm.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.ubigeoForm.controls).forEach(key => {
        this.ubigeoForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Mostrar indicador de carga
    Swal.fire({
      title: 'Procesando',
      text: 'Guardando información...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    if (this.editMode) {
      this.ubigeoService.editar(this.ubigeoForm.value.id, this.ubigeoForm.value).subscribe({
        next: (updatedUbicacion) => {
          Swal.fire({
            icon: 'success',
            title: 'Ubicación actualizada',
            text: `La ubicación ${updatedUbicacion.province || ''} ha sido actualizada con éxito.`,
            timer: 2000,
            showConfirmButton: false
          });
          this.listarUbicaciones();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al actualizar ubicación:', err);
          this.mostrarError('Error al actualizar la ubicación');
        },
      });
    } else {
      this.ubigeoService.crear(this.ubigeoForm.value).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Ubicación agregada',
            text: 'La ubicación ha sido creada con éxito.',
            timer: 2000,
            showConfirmButton: false
          });
          this.listarUbicaciones();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al agregar ubicación:', err);
          this.mostrarError('Error al agregar la ubicación');
        },
      });
    }
  }

  eliminarUbicacion(id: number): void {
    // Configurar SweetAlert2 para ser más responsive en móviles
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-danger mx-2 text-sm',
        cancelButton: 'btn btn-secondary mx-2 text-sm'
      },
      buttonsStyling: true
    });

    swalWithBootstrapButtons.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción desactivará la ubicación',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ubigeoService.eliminarLogico(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Ubicación eliminada',
              text: `La ubicación ha sido desactivada correctamente.`,
              timer: 2000,
              showConfirmButton: false
            });
            this.listarUbicaciones();
          },
          error: (err) => {
            console.error('Error al eliminar ubicación:', err);
            this.mostrarError('Error al desactivar la ubicación');
          },
        });
      }
    });
  }

  restaurarUbicacion(id: number): void {
    // Configurar SweetAlert2 para ser más responsive en móviles
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success mx-2 text-sm',
        cancelButton: 'btn btn-danger mx-2 text-sm'
      },
      buttonsStyling: true
    });

    swalWithBootstrapButtons.fire({
      title: '¿Restaurar ubicación?',
      text: 'Esta acción activará nuevamente la ubicación',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ubigeoService.restaurar(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Ubicación restaurada',
              text: 'La ubicación ha sido activada nuevamente.',
              timer: 2000,
              showConfirmButton: false
            });
            this.listarUbicaciones();
          },
          error: (error) => {
            console.error('Error al restaurar la ubicación:', error);
            this.mostrarError('Error al restaurar la ubicación');
          },
        });
      }
    });
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.filtrarUbicaciones();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.filtrarUbicaciones();
    }
  }

  toggleStatus(): void {
    this.statusFilter = this.statusActive ? 'A' : 'I';
    this.page = 1; // Resetear a la primera página
    this.filtrarUbicaciones();
  }

  // Método auxiliar para mostrar errores
  private mostrarError(mensaje: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      timer: 3000,
      showConfirmButton: false
    });
  }
}