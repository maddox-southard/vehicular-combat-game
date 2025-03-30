import * as THREE from 'three';

export class GameUI {
    constructor() {
        this.setupBossHealthBar();
        this.setupPlayerHealthBars();
        this.setupWeaponSystem();
    }

    setupBossHealthBar() {
        // Create boss health bar container
        const bossContainer = document.createElement('div');
        bossContainer.id = 'boss-health-container';
        bossContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 300px;
            background: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 5px;
            display: none;
        `;

        // Boss name
        const bossName = document.createElement('div');
        bossName.id = 'boss-name';
        bossName.textContent = 'Semi Trump';
        bossName.style.cssText = `
            color: #ff0000;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        `;

        // Health bar
        const healthBar = document.createElement('div');
        healthBar.id = 'boss-health-bar';
        healthBar.style.cssText = `
            width: 100%;
            height: 20px;
            background: #300;
            border-radius: 3px;
            overflow: hidden;
        `;

        const healthFill = document.createElement('div');
        healthFill.id = 'boss-health-fill';
        healthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: #f00;
            transition: width 0.3s ease;
        `;

        healthBar.appendChild(healthFill);
        bossContainer.appendChild(bossName);
        bossContainer.appendChild(healthBar);
        document.body.appendChild(bossContainer);
    }

    setupPlayerHealthBars() {
        // Create player health bars container
        const container = document.createElement('div');
        container.id = 'player-health-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 200px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        document.body.appendChild(container);
    }

    setupWeaponSystem() {
        // Create weapon system container
        const container = document.createElement('div');
        container.id = 'weapon-system';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 200px;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            z-index: 1000;
        `;

        // Current weapon header
        const header = document.createElement('div');
        header.style.cssText = `
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #ffcc00;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);
            padding-bottom: 5px;
        `;
        header.textContent = 'Weapons';
        container.appendChild(header);

        // Current weapon
        const currentWeapon = document.createElement('div');
        currentWeapon.id = 'current-weapon';
        currentWeapon.style.cssText = `
            font-size: 14px;
            margin-bottom: 10px;
            color: #00ff00;
        `;
        container.appendChild(currentWeapon);

        // Weapon list
        const weaponList = document.createElement('div');
        weaponList.id = 'weapon-list';
        weaponList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;
        container.appendChild(weaponList);

        // Controls hint
        const controls = document.createElement('div');
        controls.style.cssText = `
            margin-top: 10px;
            font-size: 12px;
            color: #aaaaaa;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.3);
            padding-top: 5px;
        `;
        controls.innerHTML = '[Q] Switch Weapon<br>[R] Use Special';
        container.appendChild(controls);

        document.body.appendChild(container);
    }

    updateBossHealth(health, maxHealth) {
        const container = document.getElementById('boss-health-container');
        const healthFill = document.getElementById('boss-health-fill');

        if (health > 0) {
            container.style.display = 'block';
            const percentage = (health / maxHealth) * 100;
            healthFill.style.width = `${percentage}%`;
        } else {
            container.style.display = 'none';
        }
    }

    updatePlayerHealth(playerId, health, maxHealth, username) {
        let playerBar = document.getElementById(`health-${playerId}`);

        if (!playerBar) {
            // Create new health bar for player
            playerBar = this.createPlayerHealthBar(playerId, username);
        }

        const healthFill = playerBar.querySelector('.health-fill');
        const percentage = (health / maxHealth) * 100;
        healthFill.style.width = `${percentage}%`;
    }

    createPlayerHealthBar(playerId, username) {
        const container = document.getElementById('player-health-container');

        const playerBar = document.createElement('div');
        playerBar.id = `health-${playerId}`;
        playerBar.style.cssText = `
            background: rgba(0, 0, 0, 0.5);
            padding: 5px;
            border-radius: 3px;
        `;

        const playerName = document.createElement('div');
        playerName.textContent = username;
        playerName.style.cssText = `
            color: #fff;
            font-size: 14px;
            margin-bottom: 3px;
        `;

        const healthBar = document.createElement('div');
        healthBar.style.cssText = `
            width: 100%;
            height: 15px;
            background: #300;
            border-radius: 2px;
            overflow: hidden;
        `;

        const healthFill = document.createElement('div');
        healthFill.className = 'health-fill';
        healthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: #0f0;
            transition: width 0.3s ease;
        `;

        healthBar.appendChild(healthFill);
        playerBar.appendChild(playerName);
        playerBar.appendChild(healthBar);
        container.appendChild(playerBar);

        return playerBar;
    }

    removePlayerHealthBar(playerId) {
        const playerBar = document.getElementById(`health-${playerId}`);
        if (playerBar) {
            playerBar.remove();
        }
    }

    updateWeaponSystem(weapons, currentWeapon, ammo) {
        console.log('UI Update:', {
            weapons: [...weapons],
            currentWeapon,
            ammo: Object.fromEntries(ammo)
        });

        const currentWeaponDiv = document.getElementById('current-weapon');
        const weaponList = document.getElementById('weapon-list');

        if (!currentWeaponDiv || !weaponList) {
            console.error('Weapon system UI elements not found!');
            return;
        }

        // Update current weapon display
        const formattedCurrentWeapon = this.formatWeaponName(currentWeapon);
        currentWeaponDiv.textContent = `Active: ${formattedCurrentWeapon}`;
        currentWeaponDiv.style.color = '#00ff00';

        // Clear and rebuild weapon list
        weaponList.innerHTML = '';
        weapons.forEach(weapon => {
            const weaponDiv = document.createElement('div');
            const isCurrentWeapon = weapon === currentWeapon;
            const ammoCount = weapon === 'machineGun' ? '∞' : ammo.get(weapon) || 0;

            weaponDiv.style.cssText = `
                padding: 5px 10px;
                border-radius: 4px;
                background: ${isCurrentWeapon ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)'};
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background-color 0.3s ease;
            `;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = this.formatWeaponName(weapon);
            nameSpan.style.color = isCurrentWeapon ? '#ffcc00' : '#ffffff';

            const ammoSpan = document.createElement('span');
            ammoSpan.textContent = ammoCount;
            ammoSpan.style.color = ammoCount > 0 ? '#00ff00' : '#ff0000';

            weaponDiv.appendChild(nameSpan);
            weaponDiv.appendChild(ammoSpan);
            weaponList.appendChild(weaponDiv);
        });
    }

    formatWeaponName(weapon) {
        switch (weapon) {
            case 'machineGun': return 'Machine Gun';
            case 'specialAttack': return 'Special Attack';
            default: return weapon;
        }
    }
} 