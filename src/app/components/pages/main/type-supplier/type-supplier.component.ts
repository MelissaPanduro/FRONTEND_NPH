import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TypeSupplierService } from '../../../../../service/type-supplier.service';
import { TypeSupplier } from '../../../../../model/TypeSupplier';
import { UbigeoService } from '../../../../../service/ubigeo.service';
import { Ubigeo } from '../../../../../model/Ubigeo';

@Component({
  selector: 'app-type-supplier',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './type-supplier.component.html',
  styleUrl: './type-supplier.component.css'
})
export class TypeSupplierComponent implements OnInit {
  typeSuppliers: TypeSupplier[] = [];
  paginatedSuppliers: TypeSupplier[] = [];
  pageSize = 5; // Reducido para mejor visualización en móvil
  currentPage = 1;
  ubigeos: Ubigeo[] = [];

  statusActive = true;
  statusFilter = 'A';
  isModalOpen = false;
  isEdit = false;
  supplier: Partial<TypeSupplier> = { address: '', name: '', status: 'A', ubigeoId: 0 };

  constructor(
    private typeSupplierService: TypeSupplierService,
    private ubigeoService: UbigeoService
  ) {}

  ngOnInit(): void {
    this.loadTypeSuppliers();
    this.loadUbigeos();
    this.adjustPageSizeForScreenSize();
  }

  // Nuevo método para ajustar el tamaño de página según el tamaño de pantalla
  adjustPageSizeForScreenSize(): void {
    const setPageSize = () => {
      // En pantallas pequeñas, mostrar menos elementos por página
      if (window.innerWidth < 768) {
        this.pageSize = 5;
      } else {
        this.pageSize = 10;
      }
      this.applyStatusFilter();
    };

    // Configuramos para el tamaño inicial
    setPageSize();

    // Y también cuando la ventana cambie de tamaño
    window.addEventListener('resize', setPageSize);
  }

  loadTypeSuppliers(): void {
    this.typeSupplierService.getAll().subscribe(
      (data) => {
        this.typeSuppliers = data;
        this.applyStatusFilter();
      },
      (error) => {
        console.error('Error al cargar los tipos de proveedores:', error);
        // Mostrar SweetAlert adaptado para móvil
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los tipos de proveedores',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          heightAuto: false // Mejor visualización en móvil
        });
      }
    );
  }

  loadUbigeos(): void {
    this.ubigeoService.listarTodos().subscribe(
      (data) => {
        this.ubigeos = data;
      },
      (error) => {
        console.error('Error al cargar los Ubigeos:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los ubigeos',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          heightAuto: false
        });
      }
    );
  }

  getUbigeoName(ubigeoId: number): string {
    const ubigeo = this.ubigeos.find((u) => u.id === ubigeoId);
    return ubigeo ? `${ubigeo.department} - ${ubigeo.district}` : 'Desconocido';
  }

  toggleStatus(status: boolean): void {
    this.statusActive = status;
    this.statusFilter = status ? 'A' : 'I';
    this.currentPage = 1; // Volver a la primera página al cambiar filtro
    this.applyStatusFilter();
  }

  applyStatusFilter(): void {
    const filteredSuppliers = this.typeSuppliers.filter(
      (supplier) => supplier.status === this.statusFilter
    );

    this.paginatedSuppliers = filteredSuppliers.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  getPages(): number[] {
    const totalPages = Math.ceil(
      this.typeSuppliers.filter((s) => s.status === this.statusFilter).length /
        this.pageSize
    );
    
    // Para pantallas pequeñas, limitar el número de botones de página mostrados
    if (window.innerWidth < 768 && totalPages > 5) {
      const currentPage = this.currentPage;
      const pages = [];
      
      if (currentPage <= 3) {
        // Si estamos cerca del inicio, mostrar las primeras 5 páginas
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Si estamos cerca del final, mostrar las últimas 5 páginas
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Si estamos en el medio, mostrar el actual y 2 a cada lado
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    }
    
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  cambiarPagina(pagina: number): void {
    this.currentPage = pagina;
    this.applyStatusFilter();
  }

  openModal(editSupplier?: TypeSupplier) {
    this.isModalOpen = true;
    this.isEdit = !!editSupplier;
    this.supplier = editSupplier ? { ...editSupplier } : { address: '', name: '', status: 'A', ubigeoId: 0 };
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveSupplier() {
    // Configuración móvil para SweetAlert
    const swalConfig = {
      heightAuto: false,
      width: window.innerWidth < 768 ? '85%' : '32em'
    };

    if (this.isEdit) {
      this.typeSupplierService.update(this.supplier.id!, this.supplier as TypeSupplier).subscribe(
        () => {
          Swal.fire({
            title: 'Éxito',
            text: 'Proveedor actualizado con éxito',
            icon: 'success',
            ...swalConfig
          });
          this.closeModal();
          this.loadTypeSuppliers();
        },
        (error) => {
          console.error('Error al actualizar:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar el proveedor',
            icon: 'error',
            ...swalConfig
          });
        }
      );
    } else {
      this.typeSupplierService.create(this.supplier as TypeSupplier).subscribe(
        () => {
          Swal.fire({
            title: 'Éxito',
            text: 'Proveedor creado con éxito',
            icon: 'success',
            ...swalConfig
          });
          this.closeModal();
          this.loadTypeSuppliers();
        },
        (error) => {
          console.error('Error al crear:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo crear el proveedor',
            icon: 'error',
            ...swalConfig
          });
        }
      );
    }
  }

  softDelete(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción desactivará el proveedor.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      heightAuto: false,
      width: window.innerWidth < 768 ? '85%' : '32em'
    }).then((result) => {
      if (result.isConfirmed) {
        this.typeSupplierService.softDelete(id).subscribe(
          () => {
            Swal.fire({
              title: 'Desactivado',
              text: 'El proveedor ha sido desactivado.',
              icon: 'success',
              heightAuto: false
            });
            this.loadTypeSuppliers();
          },
          (error) => {
            console.error('Error al eliminar proveedor:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo desactivar el proveedor',
              icon: 'error',
              heightAuto: false
            });
          }
        );
      }
    });
  }

  restore(id: number): void {
    Swal.fire({
      title: '¿Restaurar?',
      text: 'El proveedor será activado nuevamente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      heightAuto: false,
      width: window.innerWidth < 768 ? '85%' : '32em'
    }).then((result) => {
      if (result.isConfirmed) {
        this.typeSupplierService.restore(id).subscribe(
          () => {
            Swal.fire({
              title: 'Restaurado',
              text: 'El proveedor ha sido restaurado.',
              icon: 'success',
              heightAuto: false
            });
            this.loadTypeSuppliers();
          },
          (error) => {
            console.error('Error al restaurar proveedor:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo restaurar el proveedor',
              icon: 'error',
              heightAuto: false
            });
          }
        );
      }
    });
  }
}