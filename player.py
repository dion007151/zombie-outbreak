import pygame as pg
import math
from settings import *

class Player:
    def __init__(self, game):
        self.game = game
        self.x, self.y = PLAYER_POS
        self.angle = PLAYER_ANGLE
        self.health = PLAYER_MAX_HEALTH
        
        self.rel = 0
        self.time_walking = 0
        self.bob_offset = 0
        pg.mouse.get_rel() # flush initial huge values
        
    def movement(self):
        sin_a = math.sin(self.angle)
        cos_a = math.cos(self.angle)
        dx, dy = 0, 0
        speed = PLAYER_SPEED * self.game.delta_time
        speed_sin = speed * sin_a
        speed_cos = speed * cos_a

        keys = pg.key.get_pressed()
        moving = False
        if keys[pg.K_w]:
            dx += speed_cos
            dy += speed_sin
            moving = True
        if keys[pg.K_s]:
            dx += -speed_cos
            dy += -speed_sin
            moving = True
        if keys[pg.K_a]:
            dx += speed_sin
            dy += -speed_cos
            moving = True
        if keys[pg.K_d]:
            dx += -speed_sin
            dy += speed_cos
            moving = True

        self.check_wall_collision(dx, dy)

        # Mouse look
        self.angle += self.rel * MOUSE_SENSITIVITY
        self.angle %= math.tau
        
        # Head bobbing
        if moving:
            self.time_walking += self.game.delta_time
            self.bob_offset = math.sin(self.time_walking * 0.015) * 15
        else:
            self.bob_offset = 0

    def mouse_control(self):
        mx, my = pg.mouse.get_pos()
        if mx < MOUSE_BORDER_LEFT or mx > MOUSE_BORDER_RIGHT:
            pg.mouse.set_pos([HALF_WIDTH, HALF_HEIGHT])
        
        self.rel = pg.mouse.get_rel()[0]
        self.rel = max(-MOUSE_MAX_REL, min(MOUSE_MAX_REL, self.rel))

    def check_wall(self, x, y):
        return (x, y) not in self.game.map.world_map

    def check_wall_collision(self, dx, dy):
        scale = 0.2  # Collision size
        if self.check_wall(int(self.x + dx + math.copysign(scale, dx)), int(self.y)):
            self.x += dx
        if self.check_wall(int(self.x), int(self.y + dy + math.copysign(scale, dy))):
            self.y += dy
            
    def take_damage(self, amount):
        self.health -= amount
        # basic damage flash triggered here could be cool
        self.game.ui.damage_flash_alpha = 150
        if self.health <= 0:
            self.health = 0
            self.game.state = "GAME_OVER"
            pg.mouse.set_visible(True)
            pg.event.set_grab(False)

    def update(self):
        self.mouse_control()
        self.movement()
        
    @property
    def pos(self):
        return self.x, self.y

    @property
    def map_pos(self):
        return int(self.x), int(self.y)
