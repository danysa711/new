// migrations/YYYYMMDDHHMMSS-create-whatsapp-settings.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Buat tabel baru
    await queryInterface.createTable('whatsapp_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      whatsapp_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: '6281284712684'
      },
      trial_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      trial_template: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}'
      },
      support_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Coba pindahkan data dari tabel lama jika ada
    try {
      // Ambil data terbaru dari tabel lama
      const [oldSettings] = await queryInterface.sequelize.query(
        'SELECT * FROM whatsapp_trial_settings ORDER BY id DESC LIMIT 1'
      );

      if (oldSettings && oldSettings.length > 0) {
        // Pindahkan ke tabel baru
        await queryInterface.sequelize.query(
          `INSERT INTO whatsapp_settings 
           (whatsapp_number, trial_enabled, trial_template, support_enabled) 
           VALUES (?, ?, ?, ?)`,
          {
            replacements: [
              oldSettings[0].whatsappNumber,
              oldSettings[0].isEnabled,
              oldSettings[0].messageTemplate,
              true // Default support_enabled ke true
            ]
          }
        );
      } else {
        // Jika tidak ada data lama, masukkan data default
        await queryInterface.sequelize.query(
          `INSERT INTO whatsapp_settings 
           (whatsapp_number, trial_enabled, trial_template, support_enabled) 
           VALUES (?, ?, ?, ?)`,
          {
            replacements: [
              '6281284712684',
              true,
              'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
              true
            ]
          }
        );
      }
    } catch (error) {
      console.error('Error migrating old WhatsApp settings:', error);
      // Jika gagal memindahkan data, tetap masukkan data default
      await queryInterface.sequelize.query(
        `INSERT INTO whatsapp_settings 
         (whatsapp_number, trial_enabled, trial_template, support_enabled) 
         VALUES (?, ?, ?, ?)`,
        {
          replacements: [
            '6281284712684',
            true,
            'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
            true
          ]
        }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Hapus tabel jika rollback
    await queryInterface.dropTable('whatsapp_settings');
  }
};