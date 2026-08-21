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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../../auth/decorators/public.decorator';
import { CatalogoService } from '../services/catalogo.service';
import { QueryLibroDto } from '../dto/query-libro.dto';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CreateLibroDto } from '../dto/create-libro.dto';
import { UpdateLibroDto } from '../dto/update-libro.dto';

@ApiTags('catalogo')
@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Public()
  @Get('libros')
  findAll(@Query() query: QueryLibroDto) {
    return this.catalogoService.findAll(query);
  }

  @Public()
  @Get('libros/:id')
  findOne(@Param('id') id: string) {
    return this.catalogoService.findOne(id);
  }

  @Roles('admin')
  @Post('libros')
  create(@Body() dto: CreateLibroDto) {
    return this.catalogoService.create(dto);
  }

  @Roles('admin')
  @Patch('libros/:id')
  update(@Param('id') id: string, @Body() dto: UpdateLibroDto) {
    return this.catalogoService.update(id, dto);
  }

  @Roles('admin')
  @Delete('libros/:id')
  remove(@Param('id') id: string) {
    return this.catalogoService.remove(id);
  }

  @Public()
  @Get('autores')
  findAllAutores() {
    return this.catalogoService.findAllAutores();
  }

  @Public()
  @Get('editoriales')
  findAllEditoriales() {
    return this.catalogoService.findAllEditoriales();
  }

  @Public()
  @Get('categorias')
  findAllCategorias() {
    return this.catalogoService.findAllCategorias();
  }

  @Roles('admin', 'cajero')
  @Get('stock-bajo')
  findStockBajo() {
    return this.catalogoService.findStockBajo();
  }
}
