import pygame as pg
import math
from settings import *

class Entity:
    def __init__(self, game, x, y, image, is_enemy=False, is_pickup=False):
        self.game = game
        self.x = x
        self.y = y
        self.image = image
        self.is_enemy = is_enemy
        self.is_pickup = is_pickup
        self.alive = True
        self.is_dead = False
        self.death_progress = 0
        self.time_alive = 0
        self.hit_time = 0

    def update(self):
        pass

    def draw(self, z_buffer):
        if not self.alive:
            return

        dx = self.x - self.game.player.x
        dy = self.y - self.game.player.y

        theta = math.atan2(dy, dx)
        delta = theta - self.game.player.angle
        if (dx > 0 and self.game.player.angle > math.pi) or (dx < 0 and dy < 0):
            delta += math.tau

        delta_rays = delta / DELTA_ANGLE
        x_screen = (HALF_NUM_RAYS + delta_rays) * SCALE

        dist = math.hypot(dx, dy)
        norm_dist = dist * math.cos(delta)
        
        if -1 < x_screen < WIDTH + SCALE and norm_dist > 0.5:
            proj = SCREEN_DIST / norm_dist * 0.8
            half_proj = proj // 2
            shift = proj // 2

            ray_index = int(x_screen // SCALE)
            if 0 <= ray_index < NUM_RAYS and proj > 1:
                wall_depth = z_buffer[ray_index]
                if norm_dist < wall_depth:
                    
                    # Squish animation factor if dying
                    if getattr(self, 'is_dead', False):
                        self.death_progress += self.game.delta_time
                        if self.death_progress > 500:
                            self.death_progress = 500
                    
                    squish_factor = getattr(self, 'death_progress', 0) / 500.0
                    draw_height = int(proj * (1.0 - (0.9 * squish_factor)))
                    squish_shift = (proj - draw_height) // 2
                    
                    if draw_height > 1:
                        # scale image with squish
                        scaled = pg.transform.scale(self.image, (int(proj), draw_height))
                        
                        # Apply shading properly while respecting alpha mask!
                        if norm_dist > 1.5:
                            shade_val = min(255, int((norm_dist * 15)))
                            shade = pg.Surface(scaled.get_size())
                            shade.fill((shade_val, shade_val, shade_val))
                            scaled.blit(shade, (0, 0), special_flags=pg.BLEND_RGB_SUB)
                            
                        # Blood effect when hit
                        current_time = pg.time.get_ticks()
                        if getattr(self, 'hit_time', 0) > 0 and current_time - self.hit_time < 200:
                            blood_surf = pg.Surface(scaled.get_size())
                            blood_surf.fill((200, 0, 0))
                            scaled.blit(blood_surf, (0, 0), special_flags=pg.BLEND_RGB_MULT)
                            
                        rect = scaled.get_rect(center=(x_screen, HALF_HEIGHT + shift + squish_shift + self.game.player.bob_offset))
                        self.game.screen.blit(scaled, rect)

class Zombie(Entity):
    def __init__(self, game, x, y):
        super().__init__(game, x, y, game.zombie_image, is_enemy=True)
        self.health = ZOMBIE_HEALTH
        self.speed = ZOMBIE_SPEED
        self.attack_cooldown = 0
        
    def check_line_of_sight(self, dist):
        px, py = self.game.player.x, self.game.player.y
        zx, zy = self.x, self.y
        if dist == 0: return True
        
        steps = int(dist * 5) # Check every 0.2 units
        dx = (px - zx) / steps
        dy = (py - zy) / steps
        
        for i in range(steps):
            cx = zx + dx * i
            cy = zy + dy * i
            if (int(cx), int(cy)) in self.game.map.world_map:
                return False
        return True
        
    def update(self):
        if not self.alive:
            return
            
        if getattr(self, 'health', 0) <= 0:
            if not getattr(self, 'is_dead', False):
                self.is_dead = True
                self.death_progress = 0
            return # Don't move or attack while dying
            
        dx = self.game.player.x - self.x
        dy = self.game.player.y - self.y
        dist = math.hypot(dx, dy)
        
        if self.attack_cooldown > 0:
            self.attack_cooldown -= self.game.delta_time

        self.time_alive += self.game.delta_time

        if dist < ZOMBIE_ATTACK_DIST:
            if self.attack_cooldown <= 0:
                self.game.player.take_damage(ZOMBIE_DAMAGE)
                self.attack_cooldown = 1000 # 1 second
        elif dist < ZOMBIE_CHASE_DIST and self.check_line_of_sight(dist):
            # Chase player with creepy lurching and wobbling
            angle_to_player = math.atan2(dy, dx)
            
            # Wobble and lurch algorithms
            import random
            lurch_factor = 1.0 + math.sin(self.time_alive * 0.005) * 0.8
            if lurch_factor < 0.3: lurch_factor = 0.1 # Sometimes they pause and stare
            
            wobble = math.cos(self.time_alive * 0.008) * 0.4
            
            move_angle = angle_to_player + wobble
            
            nx = self.x + math.cos(move_angle) * self.speed * lurch_factor * self.game.delta_time
            ny = self.y + math.sin(move_angle) * self.speed * lurch_factor * self.game.delta_time
            scale = 0.2
            if self.game.player.check_wall(int(nx + math.copysign(scale, nx - self.x)), int(self.y)):
                self.x = nx
            if self.game.player.check_wall(int(self.x), int(ny + math.copysign(scale, ny - self.y))):
                self.y = ny
        else:
            # Wander wildly
            import random
            if not hasattr(self, 'patrol_angle') or random.random() < 0.02:
                self.patrol_angle = random.uniform(0, math.tau)
            
            nx = self.x + math.cos(self.patrol_angle) * (self.speed * 0.5) * self.game.delta_time
            ny = self.y + math.sin(self.patrol_angle) * (self.speed * 0.5) * self.game.delta_time
            scale = 0.2
            if self.game.player.check_wall(int(nx + math.copysign(scale, nx - self.x)), int(self.y)):
                self.x = nx
            else: 
                self.patrol_angle += math.pi # bump wall, turn around
            if self.game.player.check_wall(int(self.x), int(ny + math.copysign(scale, ny - self.y))):
                self.y = ny
            else:
                self.patrol_angle += math.pi

class Pickup(Entity):
    def __init__(self, game, x, y, kind):
        # We generate proxy surface for pickup items if no image available, could be refined
        surf = pg.Surface((32, 32), pg.SRCALPHA)
        if kind == 'health':
            pg.draw.rect(surf, WHITE, (0, 0, 32, 32))
            pg.draw.rect(surf, RED, (12, 4, 8, 24))
            pg.draw.rect(surf, RED, (4, 12, 24, 8))
        else: # ammo
            pg.draw.rect(surf, (0,150,0), (0, 0, 32, 32))
            pg.draw.rect(surf, (200,200,0), (8, 8, 16, 16))
            
        super().__init__(game, x, y, surf, is_pickup=True)
        self.kind = kind
        
    def update(self):
        if not self.alive: return
        dx = self.game.player.x - self.x
        dy = self.game.player.y - self.y
        if math.hypot(dx, dy) < 0.5:
            self.alive = False
            if self.kind == 'health':
                self.game.player.health = min(PLAYER_MAX_HEALTH, self.game.player.health + 25)
            elif self.kind == 'ammo':
                self.game.weapon.ammo += 15

class SpriteManager:
    def __init__(self, game):
        self.game = game
        self.entities = [
            Pickup(game, 2.5, 5.5, 'health'),
            Pickup(game, 11.5, 3.5, 'ammo'),
            Pickup(game, 15.5, 1.5, 'ammo'),
            Pickup(game, 2.5, 14.5, 'health'),
            Pickup(game, 21.5, 13.5, 'ammo')
        ]
        import random
        # Randomly spawn 30 zombies on empty map tiles
        spawned = 0
        while spawned < 30:
            rx = random.randint(1, len(game.map.mini_map[0])-2)
            ry = random.randint(1, len(game.map.mini_map)-2)
            # Ensure it is a valid floor (not in world_map) and not too close to player
            if (rx, ry) not in game.map.world_map:
                if math.hypot(rx + 0.5 - PLAYER_POS[0], ry + 0.5 - PLAYER_POS[1]) > 3:
                    self.entities.append(Zombie(game, rx + 0.5, ry + 0.5))
                    spawned += 1
        
    @property
    def zombies(self):
        return [e for e in self.entities if e.is_enemy and e.alive and not getattr(e, 'is_dead', False)]
        
    def update(self):
        for e in self.entities:
            e.update()
            
    def draw(self):
        # build z-buffer from raycasting
        # ray_casting_result contains (depth, proj, texture, ray, offset)
        z_buffer = [MAX_DEPTH] * NUM_RAYS
        for depth, _, _, ray, _ in self.game.raycasting.ray_casting_result:
            z_buffer[ray] = depth
            
        # sort sprites by distance
        sorted_entities = sorted(self.entities, key=lambda e: math.hypot(e.x - self.game.player.x, e.y - self.game.player.y), reverse=True)
        
        for e in sorted_entities:
            e.draw(z_buffer)
