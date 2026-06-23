import pygame as pg
from settings import *

class UI:
    def __init__(self, game):
        self.game = game
        self.font = pg.font.SysFont('Arial', 30)
        self.big_font = pg.font.SysFont('Arial', 70, bold=True)
        self.title_font = pg.font.SysFont('Arial', 76, bold=True)
        self.menu_font = pg.font.SysFont('Arial', 34, bold=True)
        self.small_font = pg.font.SysFont('Arial', 20)
        self.damage_flash_alpha = 0
        button_w, button_h = 260, 58
        self.menu_buttons = {
            "start": pg.Rect(HALF_WIDTH - button_w // 2, HALF_HEIGHT + 54, button_w, button_h),
            "continue": pg.Rect(HALF_WIDTH - button_w // 2, HALF_HEIGHT + 124, button_w, button_h),
        }
        
    def update(self):
        if self.damage_flash_alpha > 0:
            self.damage_flash_alpha -= 5 * self.game.delta_time
            self.damage_flash_alpha = max(0, self.damage_flash_alpha)

    def draw_minimap(self):
        map_surface = pg.Surface((WIDTH // 4, HEIGHT // 4))
        map_surface.fill((0, 0, 0))
        map_surface.set_alpha(150)
        
        # Scaling factor for minimap
        sw = map_surface.get_width() / len(self.game.map.mini_map[0])
        sh = map_surface.get_height() / len(self.game.map.mini_map)
        
        for y, row in enumerate(self.game.map.mini_map):
            for x, value in enumerate(row):
                if value:
                    color = WALL_COLORS.get(value, (100, 100, 100))
                    pg.draw.rect(map_surface, color, (x*sw, y*sh, sw, sh))
                    
        # Draw player on minimap
        px, py = self.game.player.pos
        pg.draw.circle(map_surface, GREEN, (int(px * sw), int(py * sh)), 3)
        
        # Direction line on minimap
        end_x = px * sw + math.cos(self.game.player.angle) * 10
        end_y = py * sh + math.sin(self.game.player.angle) * 10
        pg.draw.line(map_surface, GREEN, (int(px * sw), int(py * sh)), (int(end_x), int(end_y)), 1)
        
        self.game.screen.blit(map_surface, (WIDTH - map_surface.get_width() - 10, 10))

    def get_menu_action(self, pos):
        for action, rect in self.menu_buttons.items():
            if rect.collidepoint(pos):
                if action == "continue" and not self.game.has_game:
                    return None
                return action
        return None

    def draw_menu_button(self, action, label, enabled=True):
        rect = self.menu_buttons[action]
        mouse_pos = pg.mouse.get_pos()
        hovered = enabled and rect.collidepoint(mouse_pos)
        base = (154, 23, 30) if enabled else (44, 44, 48)
        edge = (246, 202, 80) if hovered else ((95, 95, 100) if not enabled else (210, 68, 58))
        text_color = WHITE if enabled else (145, 145, 150)

        pg.draw.rect(self.game.screen, (9, 9, 12), rect.move(4, 5), border_radius=8)
        pg.draw.rect(self.game.screen, base, rect, border_radius=8)
        pg.draw.rect(self.game.screen, edge, rect, 2, border_radius=8)

        text = self.menu_font.render(label, True, text_color)
        text_rect = text.get_rect(center=rect.center)
        self.game.screen.blit(text, text_rect)

    def draw_menu(self):
        if getattr(self.game, "menu_wallpaper", None):
            self.game.screen.blit(self.game.menu_wallpaper, (0, 0))
        else:
            self.game.screen.fill((12, 13, 16))
            pg.draw.rect(self.game.screen, (38, 22, 24), (0, HALF_HEIGHT, WIDTH, HALF_HEIGHT))

        shade = pg.Surface((WIDTH, HEIGHT), pg.SRCALPHA)
        shade.fill((0, 0, 0, 82))
        pg.draw.rect(shade, (0, 0, 0, 125), (0, 0, WIDTH, HEIGHT))
        pg.draw.rect(shade, (88, 0, 0, 54), (0, 0, WIDTH, HEIGHT))
        self.game.screen.blit(shade, (0, 0))

        title_shadow = self.title_font.render("ZOMBIE SCHOOL", True, (18, 6, 7))
        title = self.title_font.render("ZOMBIE SCHOOL", True, (238, 236, 218))
        outbreak_shadow = self.big_font.render("OUTBREAK", True, (18, 6, 7))
        outbreak = self.big_font.render("OUTBREAK", True, (205, 28, 28))

        title_rect = title.get_rect(center=(HALF_WIDTH, 124))
        outbreak_rect = outbreak.get_rect(center=(HALF_WIDTH, 190))
        self.game.screen.blit(title_shadow, title_rect.move(4, 5))
        self.game.screen.blit(title, title_rect)
        self.game.screen.blit(outbreak_shadow, outbreak_rect.move(4, 5))
        self.game.screen.blit(outbreak, outbreak_rect)

        tagline = self.small_font.render("Survive the halls. Find the exit.", True, (225, 222, 200))
        tagline_rect = tagline.get_rect(center=(HALF_WIDTH, 252))
        self.game.screen.blit(tagline, tagline_rect)

        self.draw_menu_button("start", "START", True)
        self.draw_menu_button("continue", "CONTINUE", self.game.has_game)

        hint_text = "Enter: Start    C: Continue    Esc: Quit"
        if self.game.has_game:
            hint_text = "Esc pauses here during a run"
        hint = self.small_font.render(hint_text, True, (210, 210, 200))
        hint_rect = hint.get_rect(center=(HALF_WIDTH, HEIGHT - 36))
        self.game.screen.blit(hint, hint_rect)

    def draw(self):
        # Damage Flash with Blood Effect
        if self.damage_flash_alpha > 0:
            flash_surf = pg.Surface((WIDTH, HEIGHT), pg.SRCALPHA)
            
            # Draw semi-transparent red background
            flash_surf.fill((200, 0, 0, int(self.damage_flash_alpha * 0.4)))
            
            # Draw procedural blood screen splatters
            import random
            random.seed(int(self.damage_flash_alpha)) # Use alpha as seed to keep splatters consistent during flash
            
            for _ in range(15):
                # Random blood drips/splashes
                x = random.randint(0, WIDTH)
                y = random.randint(0, HEIGHT)
                radius = random.randint(20, 80)
                
                # Main splatter
                pg.draw.circle(flash_surf, (130, 0, 0, int(self.damage_flash_alpha)), (x, y), radius)
                
                # Small drips extending
                for _ in range(3):
                    drip_x = x + random.randint(-radius, radius)
                    drip_y = y + random.randint(0, int(radius * 3))
                    drip_rad = random.randint(3, 15)
                    pg.draw.circle(flash_surf, (130, 0, 0, int(self.damage_flash_alpha)), (drip_x, drip_y), drip_rad)
                    
            self.game.screen.blit(flash_surf, (0, 0))
            
        self.draw_minimap()

        # Health
        health_text = self.font.render(f"Health: {int(self.game.player.health)}", True, RED)
        self.game.screen.blit(health_text, (20, HEIGHT - 50))
        
        # Ammo
        ammo_text = self.font.render(f"Ammo: {self.game.weapon.ammo}", True, BLUE)
        self.game.screen.blit(ammo_text, (WIDTH - 150, HEIGHT - 50))
        
        # Zombie count
        alive_zombies = len(self.game.sprite_manager.zombies)
        zombie_text = self.font.render(f"Zombies: {alive_zombies}", True, GREEN)
        self.game.screen.blit(zombie_text, (20, 20))
        
        # Game State
        if self.game.state == "GAME_OVER":
            go_text = self.big_font.render("GAME OVER", True, RED)
            rect = go_text.get_rect(center=(HALF_WIDTH, HALF_HEIGHT))
            self.game.screen.blit(go_text, rect)
            
            retry_text = self.font.render("Press R to Retry", True, WHITE)
            retry_rect = retry_text.get_rect(center=(HALF_WIDTH, HALF_HEIGHT + 60))
            self.game.screen.blit(retry_text, retry_rect)
            
        elif self.game.state == "WIN":
            win_text = self.big_font.render("YOU SURVIVED!", True, GREEN)
            rect = win_text.get_rect(center=(HALF_WIDTH, HALF_HEIGHT))
            self.game.screen.blit(win_text, rect)
            
            retry_text = self.font.render("Press R to Play Again", True, WHITE)
            retry_rect = retry_text.get_rect(center=(HALF_WIDTH, HALF_HEIGHT + 60))
            self.game.screen.blit(retry_text, retry_rect)
