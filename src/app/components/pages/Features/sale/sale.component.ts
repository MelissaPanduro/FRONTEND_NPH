import { Component, OnInit } from '@angular/core';
import { Sale } from '../../../../../model/Sale';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../../../../../service/sale.service';
import { ProductService } from '../../../../../service/product.service';
import { Product } from '../../../../../model/Product';
import Swal from 'sweetalert2';
import { ModelSaleComponent } from './model-sale/model-sale.component';

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [CommonModule, FormsModule, ModelSaleComponent],
  templateUrl: './sale.component.html',
  styleUrls: ['./sale.component.css']
})
export class SaleComponent implements OnInit {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  paginatedSales: Sale[] = [];
  products: Product[] = [];

  searchTerm: string = '';
  searchDate: string = '';
  selectedProduct: string = '';

  currentPage: number = 1;
  salesPerPage: number = 10;
  totalPages: number = 1;

  // Propiedades para el modal
  isModalOpen = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';  // Añadido modo 'view'
  selectedSale: Sale | null = null;

  constructor(
    private saleService: SaleService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.getAllSales();
    this.getAllProducts();
  }

  getAllSales(): void {
    this.saleService.getAllSales().subscribe({
      next: (sales) => {
        this.sales = sales;
        this.filteredSales = sales;
        this.resetPagination();
      },
      error: (error) => {
        console.error('Error al obtener las ventas:', error);
      }
    });
  }

  getAllProducts(): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
      }
    });
  }

  updatePaginatedSales(): void {
    const startIndex = (this.currentPage - 1) * this.salesPerPage;
    const endIndex = startIndex + this.salesPerPage;
    this.paginatedSales = this.filteredSales.slice(startIndex, endIndex);
  }

  resetPagination(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredSales.length / this.salesPerPage);
    this.updatePaginatedSales();
  }

  filterSales(): void {
    this.filteredSales = this.sales.filter(sale =>
      sale.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.resetPagination();
  }

  filterByDate(): void {
    this.filteredSales = this.searchDate
      ? this.sales.filter(sale => sale.saleDate.startsWith(this.searchDate))
      : [...this.sales];
    this.resetPagination();
  }

  filterByProduct(): void {
    this.filteredSales = this.selectedProduct
      ? this.sales.filter(sale => sale.productId.toString() === this.selectedProduct)
      : [...this.sales];
    this.resetPagination();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedSales();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedSales();
    }
  }

  deleteSale(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.saleService.deleteSale(id).subscribe({
          next: () => {
            this.sales = this.sales.filter(s => s.id !== id);
            this.filteredSales = [...this.sales];
            this.resetPagination();
            Swal.fire('Eliminado', 'La venta ha sido eliminada.', 'success');
          },
          error: (error) => {
            console.error('Error al eliminar la venta:', error);
            Swal.fire('Error', 'No se pudo eliminar la venta.', 'error');
          }
        });
      }
    });
  }

  // Método actualizado: Ahora abre el modal en modo 'view'
  viewSaleDetails(saleId: number): void {
    const sale = this.sales.find(s => s.id === saleId);
    if (sale) {
      // Abrimos el modal en modo vista
      this.modalMode = 'view';
      this.selectedSale = {...sale};
      this.isModalOpen = true;
    }
  }

  getProductNameById(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.type : 'Producto no encontrado';
  }

  // Funciones para manejar el modal
  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedSale = null;
    this.isModalOpen = true;
  }

  openEditModal(sale: Sale): void {
    this.modalMode = 'edit';
    this.selectedSale = {...sale}; // Crear una copia para evitar referencias directas
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  handleSaleCreated(sale: Sale): void {
    this.getAllSales(); // Recargar las ventas después de crear una nueva
    Swal.fire('Éxito', 'Venta registrada correctamente', 'success');
  }

  handleSaleUpdated(sale: Sale): void {
    // Actualizar la lista de ventas
    this.getAllSales(); // O podrías actualizar localmente para evitar otra petición
    Swal.fire('Éxito', 'Venta actualizada correctamente', 'success');
  }
}