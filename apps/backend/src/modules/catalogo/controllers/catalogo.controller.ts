// src/modules/catalogo/controllers/catalogo.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Delete,
  Patch,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '@common/auth/public.decorator';
import { LibrosService } from '../services/libros.service';
import { AutoresEditorialesService } from '../services/autores-editoriales.service';
import { CategoriasService } from '../services/categorias.service';
import { QueryLibroDto } from '../dto/query-libro.dto';
import { Roles } from '@common/auth/roles.decorator';
import { CreateLibroDto } from '../dto/create-libro.dto';
import { UpdateLibroDto } from '../dto/update-libro.dto';
import { CreateAutorDto } from '../dto/create-autor.dto';
import { UpdateAutorDto } from '../dto/update-autor.dto';
import { CreateEditorialDto } from '../dto/create-editorial.dto';
import { UpdateEditorialDto } from '../dto/update-editorial.dto';
import { CreateCategoriaDto } from '../dto/create-categoria.dto';
import { UpdateCategoriaDto } from '../dto/update-categoria.dto';

const TAMANO_MAXIMO_PORTADA = 2 * 1024 * 1024; // 2MB

@ApiTags('catalogo')
@Controller('catalogo')
export class CatalogoController {
  constructor(
    private readonly librosService: LibrosService,
    private readonly autoresEditorialesService: AutoresEditorialesService,
    private readonly categoriasService: CategoriasService,
  ) {}

  @Public()
  @Get('libros')
  findAll(@Query() query: QueryLibroDto, @Req() req: Request) {
    return this.librosService.findAll(query, this.baseUrl(req));
  }

  @Public()
  @Get('libros/:id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.librosService.findOne(id, this.baseUrl(req));
  }

  @Roles('admin')
  @Post('libros')
  create(@Body() dto: CreateLibroDto, @Req() req: Request) {
    return this.librosService.create(dto, this.baseUrl(req));
  }

  @Roles('admin')
  @Patch('libros/:id')
  update(@Param('id') id: string, @Body() dto: UpdateLibroDto, @Req() req: Request) {
    return this.librosService.update(id, dto, this.baseUrl(req));
  }

  @Roles('admin')
  @Delete('libros/:id')
  remove(@Param('id') id: string) {
    return this.librosService.remove(id);
  }

  @Roles('admin')
  @Post('libros/:id/portada')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('archivo'))
  subirPortada(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: TAMANO_MAXIMO_PORTADA,
            message: 'La imagen excede el tamaño máximo de 2MB',
          }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    archivo: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.librosService.actualizarPortada(id, archivo, this.baseUrl(req));
  }

  @Roles('admin')
  @Delete('libros/:id/portada')
  eliminarPortada(@Param('id') id: string, @Req() req: Request) {
    return this.librosService.eliminarPortada(id, this.baseUrl(req));
  }

  @Public()
  @Get('autores')
  findAllAutores() {
    return this.autoresEditorialesService.findAllAutores();
  }

  @Roles('admin')
  @Post('autores')
  createAutor(@Body() dto: CreateAutorDto) {
    return this.autoresEditorialesService.createAutor(dto);
  }

  @Roles('admin')
  @Patch('autores/:id')
  updateAutor(@Param('id') id: string, @Body() dto: UpdateAutorDto) {
    return this.autoresEditorialesService.updateAutor(id, dto);
  }

  @Roles('admin')
  @Delete('autores/:id')
  removeAutor(@Param('id') id: string) {
    return this.autoresEditorialesService.removeAutor(id);
  }

  @Public()
  @Get('editoriales')
  findAllEditoriales() {
    return this.autoresEditorialesService.findAllEditoriales();
  }

  @Roles('admin')
  @Post('editoriales')
  createEditorial(@Body() dto: CreateEditorialDto) {
    return this.autoresEditorialesService.createEditorial(dto);
  }

  @Roles('admin')
  @Patch('editoriales/:id')
  updateEditorial(@Param('id') id: string, @Body() dto: UpdateEditorialDto) {
    return this.autoresEditorialesService.updateEditorial(id, dto);
  }

  @Roles('admin')
  @Delete('editoriales/:id')
  removeEditorial(@Param('id') id: string) {
    return this.autoresEditorialesService.removeEditorial(id);
  }

  @Public()
  @Get('categorias')
  findAllCategorias() {
    return this.categoriasService.findAllCategorias();
  }

  @Roles('admin')
  @Post('categorias')
  createCategoria(@Body() dto: CreateCategoriaDto) {
    return this.categoriasService.createCategoria(dto);
  }

  @Roles('admin')
  @Patch('categorias/:id')
  updateCategoria(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.categoriasService.updateCategoria(id, dto);
  }

  @Roles('admin')
  @Delete('categorias/:id')
  removeCategoria(@Param('id') id: string) {
    return this.categoriasService.removeCategoria(id);
  }

  @Roles('admin', 'cajero')
  @Get('stock-bajo')
  findStockBajo() {
    return this.librosService.findStockBajo();
  }

  private baseUrl(req: Request): string {
    return `${req.protocol}://${req.get('host')}`;
  }
}
