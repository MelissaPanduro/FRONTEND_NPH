import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Shed } from '../../../../../interfaces/Shed';
import { ShedService } from '../../../../../service/shed.service';
import { VaccineApplicationsService } from '../../../../../service/vaccineAplications';
import { formatDate } from '@angular/common';
import { VaccineApplications } from '../../../../../interfaces/VaccineAplications';
import { CicloVida } from '../../../../../interfaces/Lifecycle';
import { CicloVidaService } from '../../../../../service/lifecycle.service';
import { ModalAplicationsComponent } from "./modal-aplications/modal-aplications.component";
import * as ExcelJS from 'exceljs';
import saveAs from 'file-saver';
import jsPDF from 'jspdf';

@Component({
  standalone: true,  imports: [CommonModule, HttpClientModule, FormsModule, ModalAplicationsComponent],
  templateUrl: './vaccine-aplications.component.html',
  styles: []
})
export class VaccineApplicationsComponent implements OnInit {
  
  isModalOpen = false;
  applications: VaccineApplications[] = [];
  filteredApplications: VaccineApplications[] = [];
  cycleLifes: CicloVida[] = [];
  isLoading: boolean = true;
  isEditMode: boolean = false;
  formSubmitted: boolean = false;
  applicationForm: VaccineApplications = {} as VaccineApplications;

  activeActive = true;
  activeFilter = 'A';
  paginatedVaccineApplications: VaccineApplications[] = [];
  pageSize = 10;
  currentPage = 1;

  totalPages: number = 0;

  applicationIdFilter: string = '';
  amountFilter: string = '';
  feedbackMessage: string = '';
  showFeedback: boolean = false;
  showExportDropdown: boolean = false;
  

  constructor(
    private vaccineApplicationsService: VaccineApplicationsService,
    private cicloVidaService: CicloVidaService
  ) {}

  ngOnInit(): void {
    this.getApplications();
    this.loadCycles();
  }



  // Función PDF mejorada
downloadPDF(): void {
    const dataToExport = this.applications.filter(applications => applications.active === this.activeFilter);
    const doc = new jsPDF('l', 'mm', 'a4'); // Orientación horizontal para más espacio

    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista de Aplicación de Vacunas', 20, 20);

    // Información del reporte
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estado: ${this.activeFilter === 'A' ? 'Activos' : 'Inactivos'}`, 20, 35);

    const today = new Date();
    doc.text(`Generado el: ${today.toLocaleDateString()} a las ${today.toLocaleTimeString()}`, 20, 45);
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 50, 277, 50);

    const tableColumn = [
        'Fecha Aplicación', 
        'Fecha Registro', 
        'Galpón', 
        'Vía Aplicación', 
        'Vacuna', 
        'Cantidad', 
        'Costo', 
        'Email', 
        'Cant. Aves', 
        'Tiempo Vida', 
        'Estado'
    ];
    
    const tableRows = dataToExport.map(item => [
        this.formatDate(item.endDate) || 'N/A',
        this.formatDate(item.dateRegistration) || 'N/A',
        `Galpón: ${item.henId || 'N/A'}`,
        item.viaApplication || 'N/A',
        this.getNameIto(item.cycleLifeId, item) || 'N/A',
        item.amount?.toString() || '0',
        `S/${item.costApplication?.toString() || '0'}`,
        item.email || 'N/A',
        item.quantityBirds?.toString() || '0',
        `${item.timesInWeeks || '0'} sem.`,
        item.active === 'A' ? 'Activo' : 'Inactivo'
    ]);

    import('jspdf-autotable').then(x => {
        const autoTable = (x as any).default || x;
        autoTable(doc, {
            startY: 55,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: 'linebreak',
                halign: 'center'
            },
            headStyles: { 
                fillColor: [0, 123, 255],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Fecha Aplicación
                1: { cellWidth: 25 }, // Fecha Registro
                2: { cellWidth: 22 }, // Galpón
                3: { cellWidth: 20 }, // Vía Aplicación
                4: { cellWidth: 30 }, // Vacuna
                5: { cellWidth: 18 }, // Cantidad
                6: { cellWidth: 20 }, // Costo
                7: { cellWidth: 35 }, // Email
                8: { cellWidth: 18 }, // Cant. Aves
                9: { cellWidth: 20 }, // Tiempo Vida
                10: { cellWidth: 18 } // Estado
            }
        });

        doc.save('aplicacion_vacunas.pdf');
    }).catch(err => {
        console.error('Error al cargar jspdf-autotable', err);
        // Fallback manual con mejor espaciado
        let y = 60;
        doc.setFontSize(8);

        // Headers
        doc.setFont('helvetica', 'bold');
        tableColumn.forEach((header, i) => {
            doc.text(header, 20 + (i * 30), y);
        });

        // Data rows
        doc.setFont('helvetica', 'normal');
        y += 10;
        tableRows.forEach(row => {
            row.forEach((cell, i) => {
                doc.text(cell, 20 + (i * 30), y);
            });
            y += 8;
            
            // Nueva página si es necesario
            if (y > 190) {
                doc.addPage();
                y = 20;
                // Repetir headers
                doc.setFont('helvetica', 'bold');
                tableColumn.forEach((header, i) => {
                    doc.text(header, 20 + (i * 30), y);
                });
                doc.setFont('helvetica', 'normal');
                y += 10;
            }
        });

        doc.save('aplicacion_vacunas.pdf');
    });
}

// Función Excel mejorada
downloadExcel(): void {
    const dataToExport = this.applications.filter(applications => applications.active === this.activeFilter);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Aplicaciones de Vacunas');

    // Configuración de columnas con mejor ancho
    worksheet.columns = [
        { header: 'Fecha de Aplicación', key: 'fechaAplicacion', width: 18 },
        { header: 'Fecha de Registro', key: 'fechaRegistro', width: 18 },
        { header: 'Galpón', key: 'galpon', width: 15 },
        { header: 'Vía de Aplicación', key: 'viaAplicacion', width: 18 },
        { header: 'Vacuna', key: 'vacuna', width: 25 },
        { header: 'Cantidad Aplicada', key: 'cantidadAplicada', width: 18 },
        { header: 'Costo de Aplicación', key: 'costoAplicacion', width: 18 },
        { header: 'Correo Electrónico', key: 'correoElectronico', width: 30 },
        { header: 'Cantidad de Aves', key: 'cantidadAves', width: 18 },
        { header: 'Tiempo de Vida (Semanas)', key: 'tiempoVida', width: 22 },
        { header: 'Estado', key: 'estado', width: 12 }
    ];

    // Estilo del header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F81BD' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 20;

    // Agregar datos con formato mejorado
    dataToExport.forEach((item, index) => {
        const row = worksheet.addRow({
            fechaAplicacion: this.formatDate(item.endDate) || 'N/A',
            fechaRegistro: this.formatDate(item.dateRegistration) || 'N/A',
            galpon: `Galpón: ${item.henId || 'N/A'}`,
            viaAplicacion: item.viaApplication || 'N/A',
            vacuna: this.getNameIto(item.cycleLifeId, item) || 'N/A',
            cantidadAplicada: item.amount || 0,
            costoAplicacion: item.costApplication || 0,
            correoElectronico: item.email || 'N/A',
            cantidadAves: item.quantityBirds || 0,
            tiempoVida: item.timesInWeeks || 0,
            estado: item.active === 'A' ? 'Activo' : 'Inactivo'
        });

        // Alternar colores de fila
        if (index % 2 === 0) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F8F9FA' }
            };
        }

        // Centrar datos
        row.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Formato especial para columnas numéricas
        row.getCell('cantidadAplicada').numFmt = '#,##0';
        row.getCell('costoAplicacion').numFmt = '"S/"#,##0.00';
        row.getCell('cantidadAves').numFmt = '#,##0';
    });

    // Bordes para toda la tabla
    const totalRows = dataToExport.length + 1;
    const range = `A1:K${totalRows}`;
    worksheet.getCell(range).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };

    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'aplicacion_vacunas.xlsx');
    });
}

// Función CSV mejorada
downloadCSV(): void {
    const dataToExport = this.applications.filter(applications => applications.active === this.activeFilter);
    const headers = [
        'Fecha de Aplicación',
        'Fecha de Registro', 
        'Galpón', 
        'Vía de Aplicación', 
        'Vacuna', 
        'Cantidad Aplicada', 
        'Costo de Aplicación', 
        'Correo Electrónico', 
        'Cantidad de Aves', 
        'Tiempo de Vida (Semanas)', 
        'Estado'
    ];

    const csvData = dataToExport.map(item => {
        return [
            `"${this.formatDate(item.endDate) || 'N/A'}"`,
            `"${this.formatDate(item.dateRegistration) || 'N/A'}"`,
            `"Galpón: ${item.henId || 'N/A'}"`,
            `"${item.viaApplication || 'N/A'}"`,
            `"${this.getNameIto(item.cycleLifeId, item) || 'N/A'}"`,
            `"${item.amount || 0}"`,
            `"S/${item.costApplication || 0}"`,
            `"${item.email || 'N/A'}"`,
            `"${item.quantityBirds || 0}"`,
            `"${item.timesInWeeks || 0} semanas"`,
            `"${item.active === 'A' ? 'Activo' : 'Inactivo'}"`
        ].join(',');
    });

    // Agregar BOM para caracteres especiales
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.map(h => `"${h}"`).join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'aplicacion_vacunas.csv');
}

// Función del dropdown (sin cambios)
toggleExportDropdown(event: Event): void {
    event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;

    if (this.showExportDropdown) {
        setTimeout(() => {
            const closeDropdown = () => {
                this.showExportDropdown = false;
                document.removeEventListener('click', closeDropdown);
            };
            document.addEventListener('click', closeDropdown);
        }, 0);
    }
}

  loadCycles(): void {
    const typeIto = 'Vacunas';
    this.cicloVidaService.getCiclosByTypeIto(typeIto).subscribe(
      (cycles: CicloVida[]) => {
        this.cycleLifes = cycles;
      },
      (error) => {
        console.error('Error al cargar los ciclos de vida:', error);
      }
    );
  }

  closeFeedback() {
    this.showFeedback = false;
  }

  displayFeedback(message: string) {
    this.feedbackMessage = message;
    this.showFeedback = true;
    // Cerrar automáticamente después de 3 segundos
    setTimeout(() => this.showFeedback = false, 3000);
  }

  getApplications(): void {
    this.isLoading = true;

    this.vaccineApplicationsService.vaccineApplications$.subscribe({
      next: (data: VaccineApplications[]) => {
        if (!data || data.length === 0) {
          console.warn('No se encontraron aplicaciones de vacuna.');
          this.applications = [];
          this.filteredApplications = [];
          this.isLoading = false;
          return;
        }

        this.applications = data;
        this.filterApplications();
        this.totalPages = this.getPages().length;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching applications:', err);
        this.isLoading = false;
      }
    });
  }

  getPages(): number[] {
    const totalPages = Math.ceil(
      this.applications.filter((s) => s.active === this.activeFilter).length /
      this.pageSize
    );
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  toggleActive(active: boolean): void {
    this.activeActive = active;
    this.activeFilter = active ? 'A' : 'I';
    this.filterApplications();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.getPages().length) return;
    this.currentPage = pagina;
    this.applyActiveFilter();
  }

  applyActiveFilter(): void {
    const filteredApplications = this.filteredApplications.filter(
      (app) => app.active === this.activeFilter
    );

    this.paginatedVaccineApplications = filteredApplications.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  filterApplications(): void {
    this.filteredApplications = this.applications.filter(application => {
      // Filtrar por ID si hay un filtro
      if (this.applicationIdFilter && application.applicationId) {
        if (!application.applicationId.toString().includes(this.applicationIdFilter)) {
          return false;
        }
      }
      
      // Filtrar por cantidad si hay un filtro
      if (this.amountFilter && application.amount) {
        if (!application.amount.toString().includes(this.amountFilter)) {
          return false;
        }
      }
      
      // Siempre filtrar por estado activo/inactivo
      return application.active === this.activeFilter;
    });
    
    this.applyActiveFilter();
  }

  activateApplication(applicationId: number | undefined): void {
    if (applicationId !== undefined) {
      this.vaccineApplicationsService.activateVaccineApplications(applicationId).subscribe({
        next: () => {
          this.getApplications();
          this.displayFeedback('Aplicación activada correctamente');
        },
        error: (err: any) => {
          console.error('Error activating application:', err);
          this.displayFeedback('Error al activar la aplicación');
        }
      });
    } else {
      console.error('Invalid application ID');
    }
  }

  inactivateApplication(applicationId: number | undefined): void {
    if (applicationId !== undefined) {
      this.vaccineApplicationsService.inactivateVaccineApplications(applicationId).subscribe({
        next: () => {
          this.getApplications();
          this.displayFeedback('Aplicación inactivada correctamente');
        },
        error: (err: any) => {
          console.error('Error inactivating application:', err);
          this.displayFeedback('Error al inactivar la aplicación');
        }
      });
    } else {
      console.error('Invalid application ID');
    }
  }

  formatDate(date: string | Date | null): string {
    if (date === null) {
      return '';
    }

    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    const day = parsedDate.getDate();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = monthNames[parsedDate.getMonth()];
    const year = parsedDate.getFullYear();

    return `${day}-${month}-${year}`;
  }

  getNameIto(cycleLifeId: number | undefined, application: VaccineApplications): string {
    if (!application) return 'Desconocida';

    if (cycleLifeId == null) return 'Desconocida';

    const cicloVida = this.cycleLifes?.find(c => c.id === cycleLifeId && c.typeIto === 'Vacunas');

    return cicloVida?.nameIto ?? application.nameIto ?? 'Desconocida';
  }



  calculateTotal(cost: number | undefined, quantity: number | undefined): number {
    if (cost && quantity && quantity > 0) {
      return cost * quantity;
    }
    return 0;
  }

  resetFilters() {
    this.applicationIdFilter = '';
    this.amountFilter = '';
    this.filterApplications();
  }

  // Método para abrir el modal para una nueva aplicación
  openModal(): void {
    this.isEditMode = false;
    this.applicationForm = {
      cycleLifeId: undefined,
      henId: undefined,
      endDate: '',  // Fecha actual como valor predeterminado
      timesInWeeks: '',
      dateRegistration: '',  // Fecha actual como valor predeterminado
      costApplication: 0,
      amount: undefined,
      quantityBirds: 0,
      active: 'A',
      email: '',
      viaApplication:''
    };
    this.isModalOpen = true;
  }

  // Método para abrir el modal para editar una aplicación existente
  editApplicationDetails(application: VaccineApplications): void {
    this.isEditMode = true;
    // Crear una copia profunda para evitar modificar directamente el objeto original
    this.applicationForm = JSON.parse(JSON.stringify(application));
    this.isModalOpen = true;
  }

  // Método para cerrar el modal
  closeModal(): void {
    this.isModalOpen = false;
  }

  cargarMas() {
    if (this.currentPage < this.getPages().length) {
      const nextPage = this.currentPage + 1;
      this.cambiarPagina(nextPage);
      
      this.feedbackMessage = "Más registros cargados correctamente";
      this.showFeedback = true;
      setTimeout(() => this.showFeedback = false, 3000);
    }
    
    }

  }