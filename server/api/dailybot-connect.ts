import { Request, Response } from 'express';

export async function dailyBotConnect(req: Request, res: Response) {
  const { services, config } = req.body;

  if (!services || !config || !process.env.DAILY_BOTS_KEY) {
    return res.status(400).json({
      error: 'Services, config, or DAILY_BOTS_KEY not found'
    });
  }

  const payload = {
    bot_profile: 'voice_2024_10',
    max_duration: 600,
    services,
    api_keys: {
      // API keys are injected by Daily from their secure storage
    },
    config,
  };

  try {
    const response = await fetch('https://api.daily.co/v1/bots/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_BOTS_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status !== 200) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Daily Bot connect error:', error);
    return res.status(500).json({
      error: 'Failed to start Daily Bot',
      details: error.message
    });
  }
}
