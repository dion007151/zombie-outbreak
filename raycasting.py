import pygame as pg
import math
from settings import *

class RayCasting:
    def __init__(self, game):
        self.game = game
        self.ray_casting_result = []

    def ray_cast(self):
        self.ray_casting_result = []
        ox, oy = self.game.player.pos
        x_map, y_map = self.game.player.map_pos
        
        ray_angle = self.game.player.angle - HALF_FOV + 0.0001
        for ray in range(NUM_RAYS):
            sin_a = math.sin(ray_angle)
            cos_a = math.cos(ray_angle)

            # horizontals
            y_hor, dy = (y_map + 1, 1) if sin_a > 0 else (y_map - 1e-6, -1)
            depth_hor = (y_hor - oy) / sin_a
            x_hor = ox + depth_hor * cos_a
            
            delta_depth = dy / sin_a
            dx = delta_depth * cos_a

            for i in range(MAX_DEPTH):
                tile_hor = int(x_hor), int(y_hor)
                if tile_hor in self.game.map.world_map:
                    text_hor = self.game.map.world_map[tile_hor]
                    break
                x_hor += dx
                y_hor += dy
                depth_hor += delta_depth
            else:
                depth_hor = MAX_DEPTH
                text_hor = 1

            # verticals
            x_vert, dx = (x_map + 1, 1) if cos_a > 0 else (x_map - 1e-6, -1)
            depth_vert = (x_vert - ox) / cos_a
            y_vert = oy + depth_vert * sin_a

            delta_depth = dx / cos_a
            dy = delta_depth * sin_a

            for i in range(MAX_DEPTH):
                tile_vert = int(x_vert), int(y_vert)
                if tile_vert in self.game.map.world_map:
                    text_vert = self.game.map.world_map[tile_vert]
                    break
                x_vert += dx
                y_vert += dy
                depth_vert += delta_depth
            else:
                depth_vert = MAX_DEPTH
                text_vert = 1

            # depth, texture offset
            if depth_vert < depth_hor:
                depth, text = depth_vert, text_vert
                y_vert %= 1
                offset = y_vert if cos_a > 0 else (1 - y_vert)
            else:
                depth, text = depth_hor, text_hor
                x_hor %= 1
                offset = (1 - x_hor) if sin_a > 0 else x_hor

            # remove fishbowl effect
            depth *= math.cos(self.game.player.angle - ray_angle)

            proj_height = SCREEN_DIST / (depth + 0.0001)
            
            # Save calculations for drawing and for the zbuffer (for sprites later)
            self.ray_casting_result.append((depth, proj_height, text, ray, offset))
            ray_angle += DELTA_ANGLE

    def draw(self):
        pg.draw.rect(self.game.screen, FLOOR_COLOR, (0, HALF_HEIGHT, WIDTH, HALF_HEIGHT))
        
        if hasattr(self.game, 'sky_image') and self.game.sky_image:
            # Parallax sky logic based on angle
            # Wrap angle between 0 and 1
            sky_offset = (math.degrees(self.game.player.angle) % 360) / 360.0
            # Width * 4 is the skybox size. We subtract WIDTH to get the maximum scroll distance
            x_pos = -int(sky_offset * (WIDTH * 4 - WIDTH))
            self.game.screen.blit(self.game.sky_image, (x_pos, 0))
        else:
            pg.draw.rect(self.game.screen, SKY_BLUE, (0, 0, WIDTH, HALF_HEIGHT))

        for depth, proj_height, text, ray, offset in self.ray_casting_result:
            if proj_height > HEIGHT * 5:
                # avoid drawing impossibly huge strips near zero distance
                continue

            # Calculate texture mapping
            texture = self.game.textures.get(text, self.game.textures[1])
            x_offset = int(offset * TEXTURE_SIZE)
            
            # Subsurface for the column
            wall_column = texture.subsurface(x_offset, 0, 1, TEXTURE_SIZE)
            wall_column = pg.transform.scale(wall_column, (SCALE, int(proj_height)))
            
            x_pos = ray * SCALE
            y_pos = HALF_HEIGHT - proj_height // 2 + self.game.player.bob_offset
            
            # Shading (simple alpha blend)
            self.game.screen.blit(wall_column, (x_pos, y_pos))
            
            # Soft shadow based on depth
            if depth > 1.5:
                shade_val = min(255, int((depth * 15)))
                shade = pg.Surface((SCALE, int(proj_height)))
                shade.set_alpha(shade_val)
                self.game.screen.blit(shade, (x_pos, y_pos))

    def update(self):
        self.ray_cast()
