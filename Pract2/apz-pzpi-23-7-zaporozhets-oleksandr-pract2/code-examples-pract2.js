//Приклад API-обробника створення замовлення:
  app.post('/api/orders', async (req, res) => {
    const { userId, items, deliveryAddress } = req.body;
  
    const total = await cartService.calculateTotal(items);
    const order = await orderService.create({
      userId, items, total, deliveryAddress, status: 'created'
    });
  
    await notificationService.sendOrderCreated(userId, order.id);
  
    res.status(201).json({
      message: 'Замовлення створено',
      orderId: order.id,
      total: order.total
    });
  });
//Приклад сервісного рівня:
  class OrderService {
    async create(orderData) {
      const savedOrder = await orderRepository.save(orderData);
  
     await paymentService.preparePayment(
        savedOrder.id, savedOrder.total
      );
      await deliveryService.createShipment(
        savedOrder.id, savedOrder.deliveryAddress
      );
 
      return savedOrder;
   }
 }
