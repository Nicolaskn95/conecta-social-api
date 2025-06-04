import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // Public endpoints for fetching events
  @Get('upcoming')
  getUpcomingEvents(@Query('limit') limit?: string) {
    console.log('Fetching upcoming events');
    const take = limit ? parseInt(limit, 10) : 5;
    return this.eventService.getUpcomingEvents(take);
  }

  @Get('recent')
  getRecentEvents(@Query('limit') limit?: string) {
    console.log('Fetching recent events');
    const take = limit ? parseInt(limit, 10) : 5;
    return this.eventService.getRecentEvents(take);
  }

  @Get('recent-with-instagram')
  getRecentWithInstagram(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 5;
    return this.eventService.getRecentEventsWithInstagramEmbeds(take);
  }

  // Protected endpoints for event management
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateEventDto) {
    console.log('Creating event with data:', dto);
    return this.eventService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    console.log('Fetching all events');
    return this.eventService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('actives')
  findAllActives() {
    console.log('Fetching all active events');
    return this.eventService.findAllActives();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log(`Fetching event with ID: ${id}`);
    return this.eventService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    console.log(`Updating event with ID: ${id} with data:`, dto);
    return this.eventService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log(`Removing event with ID: ${id}`);
    return this.eventService.remove(id);
  }
}
