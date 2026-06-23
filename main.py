import pygame as pg
import sys
from settings import *
from map import Map
from player import Player
from raycasting import RayCasting
from zombie import SpriteManager
from weapon import Weapon
from ui import UI
import os

class Game:
    def __init__(self):
        pg.init()
        pg.mixer.init()
        
        # Initialize display
        self.screen = pg.display.set_mode(RES, pg.FULLSCREEN | pg.SCALED)
        pg.display.set_caption("Zombie School Outbreak")
        
        self.clock = pg.time.Clock()
        self.delta_time = 1
        self.state = "MENU"
        self.has_game = False
        
        self.load_assets()
        self.ui = UI(self)
        self.show_menu()
        
        # Play music
        try:
            pg.mixer.music.load("zombie bgm.mp3")
            pg.mixer.music.play(-1) # Loop forever
        except Exception as e:
            print("Could not load zombie bgm.mp3:", e)

    def load_assets(self):
        self.textures = {}
        try:
            wall_img = pg.image.load("wall.png").convert()
            self.textures[1] = pg.transform.scale(wall_img, (TEXTURE_SIZE, TEXTURE_SIZE))
            
            # Simple color tinting for door and other walls to reuse texture if missing, or just reuse
            door_img = wall_img.copy()
            door_img.fill((100, 50, 0, 150), special_flags=pg.BLEND_RGBA_MULT)
            self.textures[2] = pg.transform.scale(door_img, (TEXTURE_SIZE, TEXTURE_SIZE))
            
            exit_img = wall_img.copy()
            exit_img.fill((0, 200, 50, 150), special_flags=pg.BLEND_RGBA_MULT)
            self.textures[3] = pg.transform.scale(exit_img, (TEXTURE_SIZE, TEXTURE_SIZE))
            
        except Exception as e:
            print("Falling back to colored surfaces:", e)
            for i in range(1, 4):
                surf = pg.Surface((TEXTURE_SIZE, TEXTURE_SIZE))
                surf.fill(WALL_COLORS.get(i, WHITE))
                self.textures[i] = surf
                
        try:
            temp_image = pg.image.load("zombie.png").convert_alpha()
            color_key = temp_image.get_at((0, 0))
            if color_key.a == 255:
                # Image has a solid background, use convert() to map colorkey
                self.zombie_image = pg.image.load("zombie.png").convert()
                self.zombie_image.set_colorkey((color_key.r, color_key.g, color_key.b))
            else:
                self.zombie_image = temp_image
        except:
            self.zombie_image = pg.Surface((TEXTURE_SIZE, TEXTURE_SIZE))
            self.zombie_image.fill(PURPLE)
            
        try:
            self.weapon_image = pg.image.load("weapon.png").convert_alpha()
        except:
            self.weapon_image = pg.Surface((60, 100))
            self.weapon_image.fill(DARKGRAY)
            
        try:
            self.sky_image = pg.image.load("skybox.png").convert()
            # Skybox should be very wide to wrap around
            self.sky_image = pg.transform.scale(self.sky_image, (WIDTH * 4, HALF_HEIGHT))
        except Exception as e:
            self.sky_image = None
            print("No skybox found:", e)

        try:
            menu_img = pg.image.load("menu_wallpaper.png").convert()
            self.menu_wallpaper = pg.transform.smoothscale(menu_img, RES)
        except Exception as e:
            self.menu_wallpaper = None
            print("No menu wallpaper found:", e)

    def new_game(self):
        self.state = "PLAYING"
        self.has_game = True
        pg.mouse.set_visible(False)
        pg.event.set_grab(True)
        self.map = Map(self)
        self.player = Player(self)
        self.raycasting = RayCasting(self)
        self.ui = UI(self) # UI needs to exist before player takes damage
        self.sprite_manager = SpriteManager(self)
        self.weapon = Weapon(self)

    def show_menu(self):
        self.state = "MENU"
        pg.mouse.set_visible(True)
        pg.event.set_grab(False)

    def continue_game(self):
        if not self.has_game:
            return
        self.state = "PLAYING"
        pg.mouse.set_visible(False)
        pg.event.set_grab(True)
        pg.mouse.get_rel()

    def update(self):
        if self.state == "PLAYING":
            self.player.update()
            self.raycasting.update()
            self.sprite_manager.update()
            self.weapon.update()
            self.check_win()

        self.ui.update()
        pg.display.flip()
        self.delta_time = self.clock.tick(FPS)

    def draw(self):
        if self.state == "MENU":
            self.ui.draw_menu()
            return

        if self.has_game:
            # We clear only in raycaster (sky/floor)
            self.raycasting.draw()
            self.sprite_manager.draw()
            self.weapon.draw()
        self.ui.draw()

    def check_events(self):
        for event in pg.event.get():
            if event.type == pg.QUIT:
                pg.quit()
                sys.exit()

            if event.type == pg.KEYDOWN:
                if event.key == pg.K_ESCAPE:
                    if self.state == "PLAYING":
                        self.show_menu()
                    else:
                        pg.quit()
                        sys.exit()
                elif self.state == "MENU":
                    if event.key in (pg.K_RETURN, pg.K_SPACE, pg.K_s):
                        self.new_game()
                    elif event.key == pg.K_c:
                        self.continue_game()
            
            # Key presses when game is over/won
            if (self.state == "GAME_OVER" or self.state == "WIN") and event.type == pg.KEYDOWN and event.key == pg.K_r:
                self.new_game()
                
            elif event.type == pg.MOUSEBUTTONDOWN:
                if event.button == 1 and self.state == "MENU":
                    action = self.ui.get_menu_action(event.pos)
                    if action == "start":
                        self.new_game()
                    elif action == "continue":
                        self.continue_game()
                elif event.button == 1 and self.state == "PLAYING":
                    self.weapon.fire()

    def check_win(self):
        px, py = self.player.map_pos
        # Check if player is on the exit door (value 3)
        if (px, py) in self.map.world_map:
            if self.map.world_map[(px, py)] == 3:
                self.state = "WIN"
                pg.mouse.set_visible(True)
                pg.event.set_grab(False)

    def run(self):
        while True:
            self.check_events()
            self.update()
            self.draw()

if __name__ == '__main__':
    game = Game()
    game.run()
