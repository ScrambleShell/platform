# How to use this package

1. Make sure nats is running. Both publisher and subscriber are open
```go
// NATS streaming server
	m.natsServer = nats.NewServer(nats.Config{FilestoreDir: m.natsPath})
	if err := m.natsServer.Open(); err != nil {
		m.logger.Error("failed to start nats streaming server", zap.Error(err))
		return err
	}

	publisher := nats.NewAsyncPublisher("nats-publisher")
	if err := publisher.Open(); err != nil {
		m.logger.Error("failed to connect to streaming server", zap.Error(err))
		return err
	}

	subscriber := nats.NewQueueSubscriber("nats-subscriber")
	if err := subscriber.Open(); err != nil {
		m.logger.Error("failed to connect to streaming server", zap.Error(err))
		return err
	}
```

2. Make sure the scraperTargetStorageService is accessible.
```go
   scraperTargetSvc platform.ScraperTargetStoreService       = m.boltClient 
```

3. Setup recorder, Make sure subscriber subscribes use the correct recorder with the correct write service.
```go
    recorder := gather.PlatformWriter{
        Timeout: time.Millisecond * 30,
        Writer: writer,
    }
    subscriber.Subscribe(MetricsSubject, "", &RecorderHandler{
		Logger:   logger,
		Recorder: recorder,
	})
```
4. Start the scheduler
```go
    scraperScheduler, err := gather.NewScheduler(10, m.logger, scraperTargetSvc, publisher, subscriber, 0, 0)
	if err != nil {
		m.logger.Error("failed to create scraper subscriber", zap.Error(err))
		return err
	}
```