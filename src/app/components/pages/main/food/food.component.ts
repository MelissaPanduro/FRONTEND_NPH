import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Food, FoodInsert, FoodUpdate } from '../../../../../model/food';
import { FoodService } from '../../../../../service/food.service';
import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './food.component.html',
})
export class FoodComponent implements OnInit {
  isModalOpen = false;
  isModalEdit = false;
  isModalDeactivate = false;
  isModalRestore = false;
  foodActive: Food[] = [];
  foodInactive: Food[] = [];
  showInactive: boolean = false;
  descargaOpen: boolean = false;
  newFood: FoodInsert = {} as FoodInsert;
  foodToEdit: FoodUpdate = {} as FoodUpdate;
  foodIdToDeactivate: number | null = null;
  foodIdToRestore: number | null = null;
  foodTypeFilter: string = '';
  filteredFoods: Food[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;

  constructor(
    private foodService: FoodService) { }

  ngOnInit(): void {
    this.loadFoods();
  }

  getTableData(): Food[] {
    let baseList = this.filteredFoods.length > 0
      ? this.filteredFoods
      : (this.showInactive ? this.foodInactive : this.foodActive);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return baseList.slice(startIndex, startIndex + this.itemsPerPage);
  }

  loadFoods(): void {
    const serviceMethod = this.showInactive
      ? this.foodService.getInactiveFoods()
      : this.foodService.getActiveFoods();

    serviceMethod.subscribe({
      next: (data: Food[]) => {
        if (this.showInactive) {
          this.foodInactive = data;
        } else {
          this.foodActive = data;
        }
      },
      error: (err) => {
        console.error('Error al cargar alimentos:', err);
      },
    });
  }

  getPages(): number[] {
    const baseList = this.filteredFoods.length > 0
      ? this.filteredFoods
      : (this.showInactive ? this.foodInactive : this.foodActive);

    const totalPages = Math.ceil(baseList.length / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  cambiarPagina(page: number): void {
    this.currentPage = page;
  }

  toggleFoodList(): void {
    this.showInactive = !this.showInactive;
    this.filteredFoods = []; // Reiniciar búsqueda al cambiar el switcher
    this.currentPage = 1; // Reinicia la paginación
    this.loadFoods();
  }


  filterByType(): void {
    if (this.foodTypeFilter.trim()) {
      this.foodService.getFoodsByType(this.foodTypeFilter).subscribe({
        next: (data: Food[]) => {
          this.filteredFoods = data;
          this.currentPage = 1;
        },
        error: (err) => {
          console.error('Error al filtrar por tipo:', err);
          this.filteredFoods = [];
        },
      });
    } else {
      this.filteredFoods = [];
      this.currentPage = 1;
    }
  }

  toggleDescarga(): void {
    this.descargaOpen = !this.descargaOpen;
  }

  addFood(): void {
    this.foodService.addNewFood(this.newFood).subscribe({
      next: () => {
        this.showInactive = false;
        this.loadFoods();
        this.closeModal();
        Swal.fire({
          icon: 'success',
          title: 'Alimento agregado',
          text: 'El alimento ha sido agregado con éxito.',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        console.error('Error al agregar alimento:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al agregar alimento',
          text: 'Ocurrió un error. Inténtalo nuevamente.',
        });
      },
    });
  }

  DatosFood(food: Food): void {
    this.isModalEdit = true;
    this.foodToEdit = {
      id_food: food.id_food,
      foodType: food.foodType,
      foodBrand: food.foodBrand,
      amount: food.amount,
      packaging: food.packaging,
      unitMeasure: food.unitMeasure
    };
  }

  updateFood(): void {
    if (this.foodToEdit) {
      this.foodService.updateFood(this.foodToEdit.id_food, this.foodToEdit).subscribe({
        next: () => {
          this.loadFoods();
          this.isModalEdit = false;
          Swal.fire({
            icon: 'success',
            title: 'Alimento actualizado',
            text: 'El alimento ha sido actualizado con éxito.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          console.error('Error al actualizar alimento:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar alimento',
            text: 'Ocurrió un error. Inténtalo nuevamente.',
          });
        },
      });
    }
  }

  openModalDeactivate(id_food: number): void {
    this.foodIdToDeactivate = id_food;
    this.isModalDeactivate = true;
  }

  deactivateFood(): void {
    if (this.foodIdToDeactivate !== null) {
      console.log(`Desactivando alimento con ID: ${this.foodIdToDeactivate}`);
      this.foodService.deactivateFood(this.foodIdToDeactivate).subscribe({
        next: (data) => {
          console.log('Respuesta del servidor:', data);
          this.loadFoods();
          this.isModalDeactivate = false;
          Swal.fire({
            icon: 'success',
            title: 'Alimento desactivado',
            text: `El alimento ha sido desactivado correctamente.`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error al desactivar alimento:', err);
          console.error('Detalles del error:', err.error);
          Swal.fire({
            icon: 'error',
            title: 'Error al desactivar',
            text: 'Hubo un problema al intentar desactivar el alimento.',
          });
        }
      });
    }
  }

  openModalRestore(id_food: number): void {
    this.foodIdToRestore = id_food;
    this.isModalRestore = true;
  }

  restoreFood(): void {
    if (this.foodIdToRestore !== null) {
      console.log(`Restaurando alimento con ID: ${this.foodIdToRestore}`);
      this.foodService.reactivateFood(this.foodIdToRestore).subscribe({
        next: (data) => {
          console.log('Respuesta del servidor:', data);
          this.loadFoods();
          this.isModalRestore = false;
          Swal.fire({
            icon: 'success',
            title: 'Alimento restaurado',
            text: `El alimento con sido restaurado correctamente.`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error al restaurar alimento:', err);
          console.error('Detalles del error:', err.error);
          Swal.fire({
            icon: 'error',
            title: 'Error al restaurar',
            text: 'Hubo un problema al intentar restaurar el alimento.',
          });
        }
      });
    }
  }

  exportToExcel(): void {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Alimentos');

    // Define columns
    worksheet.columns = [
      { header: 'Tipo de Alimento', key: 'foodType', width: 20 },
      { header: 'Marca', key: 'foodBrand', width: 20 },
      { header: 'Cantidad', key: 'amount', width: 15 },
      { header: 'Empaque', key: 'packaging', width: 15 },
      { header: 'Unidad de Medida', key: 'unitMeasure', width: 20 },
      { header: 'Fecha de Registro', key: 'entryDate', width: 20 },
      { header: 'Estado', key: 'status', width: 15 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' } // Light gray background
    };

    // Add data rows
    const data = this.filteredFoods.length > 0
      ? this.filteredFoods
      : (this.showInactive ? this.foodInactive : this.foodActive);

    data.forEach(food => {
      worksheet.addRow({
        foodType: food.foodType,
        foodBrand: food.foodBrand,
        amount: food.amount,
        packaging: food.packaging,
        unitMeasure: food.unitMeasure,
        entryDate: food.entryDate ? new Date(food.entryDate).toLocaleDateString() : '',
        status: food.status
      });
    });

    // Auto-filter the header row
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 }
    };

    // Write to buffer and download
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Alimentos.xlsx');
    });
  }

  exportToPDF(): void {
    const doc = new jsPDF();

    doc.text('Lista de Alimentos', 10, 10);

    const tableData = (this.filteredFoods.length > 0 ? this.filteredFoods : (this.showInactive ? this.foodInactive : this.foodActive))
      .map(food => [
        food.foodType,
        food.foodBrand,
        food.amount,
        food.packaging,
        food.unitMeasure,
        food.entryDate ? new Date(food.entryDate).toLocaleDateString() : '', // Convierte Date a string
        food.status,
      ]);

    autoTable(doc, {
      head: [['Tipo de Alimento', 'Marca', 'Cantidad', 'Empaque', 'Unidad de Medida', 'Fecha de Registro', 'Estado']],
      body: tableData,
    });

    // Genera el archivo PDF
    doc.save('Alimentos.pdf');
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  resetForm(): void {
    this.newFood = {} as FoodInsert;
    this.foodToEdit = {} as FoodUpdate;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isModalEdit = false;
    this.isModalDeactivate = false;
    this.isModalRestore = false;
    this.foodIdToDeactivate = null;
    this.foodIdToRestore = null;
  }

  validatePackaging(packaging: string): boolean {
    const regex = /^[a-zA-Z\s]+$/;
    return regex.test(packaging);
  }

  validateAmount(amount: string): boolean {
    const regex = /^\d+$/;
    return regex.test(amount);
  }

  validateUnitMeasure(unitMeasure: string): boolean {
    const validUnits = ['kg', 'kilogramos', 'g', 'gramos', 'ton', 'toneladas'];
    return validUnits.includes(unitMeasure.toLowerCase());
  }
}