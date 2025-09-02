// routes/api/settings.js
router.get('/tripay', auth, adminAuth, async (req, res) => {
  try {
    const settings = await Promise.all([
      Setting.findOne({ key: 'tripay_enabled' }),
      Setting.findOne({ key: 'tripay_api_key' }),
      Setting.findOne({ key: 'tripay_private_key' }),
      Setting.findOne({ key: 'tripay_merchant_code' }),
      Setting.findOne({ key: 'tripay_sandbox_mode' })
    ]);
    
    res.json({
      tripay_enabled: settings[0] ? settings[0].value === 'true' : false,
      api_key: settings[1] ? settings[1].value : '',
      private_key: settings[2] ? settings[2].value : '',
      merchant_code: settings[3] ? settings[3].value : '',
      sandbox_mode: settings[4] ? settings[4].value === 'true' : true
    });
  } catch (err) {
    console.error('Error fetching Tripay settings:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/tripay', auth, adminAuth, async (req, res) => {
  try {
    const { tripay_enabled, api_key, private_key, merchant_code, sandbox_mode } = req.body;
    
    // Update atau buat pengaturan
    await updateOrCreateSetting('tripay_enabled', tripay_enabled.toString());
    await updateOrCreateSetting('tripay_api_key', api_key);
    await updateOrCreateSetting('tripay_private_key', private_key);
    await updateOrCreateSetting('tripay_merchant_code', merchant_code);
    await updateOrCreateSetting('tripay_sandbox_mode', sandbox_mode.toString());
    
    res.json({ success: true, message: 'Pengaturan Tripay berhasil diperbarui' });
  } catch (err) {
    console.error('Error updating Tripay settings:', err);
    res.status(500).send('Server Error');
  }
});

// Fungsi helper untuk update atau buat setting
async function updateOrCreateSetting(key, value) {
  let setting = await Setting.findOne({ key });
  if (setting) {
    setting.value = value;
    await setting.save();
  } else {
    setting = new Setting({ key, value });
    await setting.save();
  }
}