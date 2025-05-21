# Copyright (c) 2025 @drclcomputers. All rights reserved.
#
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

class AIConfig:
    def __init__(self):
        self.config = {
            'cache_ttl': 3600,
            'similarity_threshold': 0.3,
            'max_recommendations': 5,
            'min_health_score': 50,
            'nutrient_weights': {
                'protein': 1.5,
                'fiber': 1.2,
                'vitamins': 1.0
            }
        }

    def update_config(self, new_config: Dict):
        self.config.update(new_config)
        self._validate_config()