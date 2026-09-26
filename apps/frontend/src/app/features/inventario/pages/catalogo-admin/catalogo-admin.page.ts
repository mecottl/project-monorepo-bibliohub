import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableColumn } from '@shared/data-table/data-table.model';
import { DataTableComponent } from '@shared/data-table/data-table.component';
import { ConfirmModalComponent } from '@shared/confirm-modal/confirm-modal.component';
import { CatalogoService } from '../../services/catalogo.service';
import { Autor, Categoria, Editorial } from '../../models/libro.model';

type Tab = 'autores' | 'editoriales' | 'categorias';

@Component({
  selector: 'app-catalogo-admin',
  imports: [ReactiveFormsModule, DataTableComponent, ConfirmModalComponent],
  templateUrl: './catalogo-admin.page.html',
  styleUrl: './catalogo-admin.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogoAdminPage {
  private readonly catalogoService = inject(CatalogoService);
  private readonly fb = inject(FormBuilder);

  tab = signal<Tab>('autores');

  autores = signal<Autor[]>([]);
  editoriales = signal<Editorial[]>([]);
  categorias = signal<Categoria[]>([]);
  loading = signal(false);
  errorMensaje = signal<string | null>(null);
  aEliminar = signal<{ tipo: Tab; id: string; nombre: string } | null>(null);

  autorForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    nacionalidad: [''],
    biografia: ['']
  });

  editorialForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    pais: [''],
    sitioWeb: ['']
  });

  categoriaForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    descripcion: ['']
  });

  columnasAutores: DataTableColumn<Autor>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'nacionalidad', label: 'Nacionalidad' }
  ];

  columnasEditoriales: DataTableColumn<Editorial>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'pais', label: 'País' }
  ];

  columnasCategorias: DataTableColumn<Categoria>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' }
  ];

  constructor() {
    this.cargarTodo();
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
  }

  private cargarTodo(): void {
    this.loading.set(true);
    this.catalogoService.listarAutores().subscribe((data) => this.autores.set(data));
    this.catalogoService.listarEditoriales().subscribe((data) => this.editoriales.set(data));
    this.catalogoService.listarCategorias().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  agregarAutor(): void {
    if (this.autorForm.invalid) return;
    const valores = this.autorForm.getRawValue();
    this.catalogoService
      .crearAutor({
        nombre: valores.nombre,
        nacionalidad: valores.nacionalidad || undefined,
        biografia: valores.biografia || undefined
      })
      .subscribe({
        next: (autor) => {
          this.autores.update((actuales) => [...actuales, autor]);
          this.autorForm.reset({ nombre: '', nacionalidad: '', biografia: '' });
        },
        error: () => this.errorMensaje.set('No se pudo crear el autor.')
      });
  }

  agregarEditorial(): void {
    if (this.editorialForm.invalid) return;
    const valores = this.editorialForm.getRawValue();
    this.catalogoService
      .crearEditorial({
        nombre: valores.nombre,
        pais: valores.pais || undefined,
        sitioWeb: valores.sitioWeb || undefined
      })
      .subscribe({
        next: (editorial) => {
          this.editoriales.update((actuales) => [...actuales, editorial]);
          this.editorialForm.reset({ nombre: '', pais: '', sitioWeb: '' });
        },
        error: () => this.errorMensaje.set('No se pudo crear la editorial.')
      });
  }

  agregarCategoria(): void {
    if (this.categoriaForm.invalid) return;
    const valores = this.categoriaForm.getRawValue();
    this.catalogoService
      .crearCategoria({
        nombre: valores.nombre,
        descripcion: valores.descripcion || undefined
      })
      .subscribe({
        next: (categoria) => {
          this.categorias.update((actuales) => [...actuales, categoria]);
          this.categoriaForm.reset({ nombre: '', descripcion: '' });
        },
        error: () => this.errorMensaje.set('No se pudo crear la categoría.')
      });
  }

  pedirEliminar(tipo: Tab, item: { id: string; nombre: string }): void {
    this.aEliminar.set({ tipo, id: item.id, nombre: item.nombre });
  }

  confirmarEliminar(): void {
    const objetivo = this.aEliminar();
    if (!objetivo) return;

    const eliminar$ =
      objetivo.tipo === 'autores'
        ? this.catalogoService.eliminarAutor(objetivo.id)
        : objetivo.tipo === 'editoriales'
          ? this.catalogoService.eliminarEditorial(objetivo.id)
          : this.catalogoService.eliminarCategoria(objetivo.id);

    eliminar$.subscribe(() => {
      if (objetivo.tipo === 'autores') {
        this.autores.update((actuales) => actuales.filter((a) => a.id !== objetivo.id));
      } else if (objetivo.tipo === 'editoriales') {
        this.editoriales.update((actuales) => actuales.filter((e) => e.id !== objetivo.id));
      } else {
        this.categorias.update((actuales) => actuales.filter((c) => c.id !== objetivo.id));
      }
      this.aEliminar.set(null);
    });
  }

  cancelarEliminar(): void {
    this.aEliminar.set(null);
  }
}
