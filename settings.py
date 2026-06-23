import math

# Game resolution
RES = WIDTH, HEIGHT = 800, 600
HALF_WIDTH = WIDTH // 2
HALF_HEIGHT = HEIGHT // 2
FPS = 60

# Player settings
PLAYER_POS = 1.5, 5.5
PLAYER_ANGLE = 0
PLAYER_SPEED = 0.0035
PLAYER_ROT_SPEED = 0.002
PLAYER_MAX_HEALTH = 100

# Mouse control settings
MOUSE_SENSITIVITY = 0.002
MOUSE_MAX_REL = 30
MOUSE_BORDER_LEFT = 100
MOUSE_BORDER_RIGHT = WIDTH - 100

# Raycasting settings
FOV = math.pi / 3
HALF_FOV = FOV / 2
NUM_RAYS = WIDTH // 2  # To improve performance we cast 1 ray per 2 pixels
HALF_NUM_RAYS = NUM_RAYS // 2
DELTA_ANGLE = FOV / NUM_RAYS
MAX_DEPTH = 20

SCREEN_DIST = HALF_WIDTH / math.tan(HALF_FOV)
SCALE = WIDTH // NUM_RAYS

# Texture settings
TEXTURE_SIZE = 64
HALF_TEXTURE_SIZE = TEXTURE_SIZE // 2

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (220, 0, 0)
GREEN = (0, 220, 0)
BLUE = (0, 0, 255)
DARKGRAY = (40, 40, 40)
PURPLE = (120, 0, 120)
SKY_BLUE = (30, 30, 30) # Darker sky for horror
FLOOR_COLOR = (20, 20, 20)

# Colors mapped to map wall indices (for minimap)
WALL_COLORS = {
    1: (150, 150, 150),  # Generic wall
    2: (180, 140, 100),  # Classroom wall
    3: (100, 180, 100),  # Exit door
}

# Sprite settings
ZOMBIE_CHASE_DIST = 6.0
ZOMBIE_ATTACK_DIST = 1.0
ZOMBIE_DAMAGE = 5
ZOMBIE_SPEED = 0.0005
ZOMBIE_HEALTH = 30
