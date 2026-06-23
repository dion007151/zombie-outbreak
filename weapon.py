import pygame as pg
import math
from settings import *

class Weapon:
    def __init__(self, game):
        self.game = game
        self.ammo = 100
        self.damage = 15
        self.fire_rate = 500  # ms
        self.last_shot = 0
        self.is_firing = False
        
        # We scale weapon up
        try:
            self.image = pg.transform.scale(self.game.weapon_image, (300, 300))
        except:
            self.image = pg.Surface((300, 300))
            self.image.fill(DARKGRAY)
            
    def fire(self):
        now = pg.time.get_ticks()
        if now - self.last_shot > self.fire_rate and self.ammo > 0:
            self.last_shot = now
            self.ammo -= 1
            self.is_firing = True
            
            # Hitscan logic
            hit_zombie = None
            min_dist = float('inf')
            
            for z in self.game.sprite_manager.zombies:
                if not z.alive:
                    continue
                    
                dx = z.x - self.game.player.x
                dy = z.y - self.game.player.y
                
                # angle between player looking dir and zombie
                angle_to_z = math.atan2(dy, dx)
                diff = angle_to_z - self.game.player.angle
                
                # normalize diff
                diff = (diff + math.pi) % math.tau - math.pi
                
                dist = math.hypot(dx, dy)
                
                # If zombie is within roughly a wider cone in front of the player
                if abs(diff) < 0.4 and dist < 15.0:
                    if dist < min_dist:
                        min_dist = dist
                        hit_zombie = z
                        
            if hit_zombie:
                hit_zombie.health -= self.damage
                hit_zombie.hit_time = pg.time.get_ticks()
                # Let zombie.py handle death animation flag instead of immediate removal
        
    def update(self):
        now = pg.time.get_ticks()
        if now - self.last_shot > 150:
            self.is_firing = False

    def draw(self):
        y_offset = 100
        x_offset = HALF_WIDTH - 150
        
        # simple recoil animation
        if self.is_firing:
            y_offset += 40
            
        # Draw Weapon
        self.game.screen.blit(self.image, (x_offset, HEIGHT - 300 + y_offset + self.game.player.bob_offset))
        
        # Complex Dynamic Muzzle flash
        if self.is_firing:
            flash_time = pg.time.get_ticks() - self.last_shot
            scale = max(0.1, 1.0 - flash_time / 150.0) # Shrink over 150ms
            
            hx, hy = HALF_WIDTH, HEIGHT - 250 + self.game.player.bob_offset
            
            import random
            # Draw jagged starburst
            points = []
            for angle in range(0, 360, 45):
                r_angle = math.radians(angle)
                dist = 80 * scale + random.randint(-10, 15) * scale 
                points.append((hx + math.cos(r_angle) * dist, hy + math.sin(r_angle) * dist))
                
                # Inner dip of star
                r_angle2 = math.radians(angle + 22)
                inner_dist = 25 * scale + random.randint(-5, 5) * scale
                points.append((hx + math.cos(r_angle2) * inner_dist, hy + math.sin(r_angle2) * inner_dist))
                
            if len(points) >= 3:
                # Orange outer burst
                pg.draw.polygon(self.game.screen, (255, 120, 0), points)
                # Bright yellow inner burst
                inner_pts = [(hx + (px-hx)*0.4, hy + (py-hy)*0.4) for px, py in points]
                pg.draw.polygon(self.game.screen, (255, 255, 150), inner_pts)
            
            # Ambient screen flash
            flash_surf = pg.Surface((WIDTH, HEIGHT))
            flash_surf.fill((255, 200, 100))
            flash_surf.set_alpha(int(40 * scale))
            self.game.screen.blit(flash_surf, (0, 0))
            
        # Crosshair
        pg.draw.circle(self.game.screen, GREEN, (HALF_WIDTH, HALF_HEIGHT), 4, 1)
