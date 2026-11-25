// Entry point: the table scene + every adventure.
import { boot } from './core/game.js';
import { createTable } from './table/table.js';
import { adventures } from './adventures/index.js';
boot({ table: createTable, adventures });
