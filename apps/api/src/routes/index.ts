import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import warehouseRoutes from './warehouse.routes';
import inventoryRoutes from './inventory.routes';
import { supplierRoutes } from './supplier.routes';
import { procurementRoutes } from './procurement.routes';
import { forecastingRoutes } from './forecasting.routes';
import { simulatorRoutes } from './simulator.routes';
import { costRoutes } from './cost.routes';
import { alertRoutes } from './alert.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/procurement', procurementRoutes);
router.use('/forecasting', forecastingRoutes);
router.use('/simulator', simulatorRoutes);
router.use('/cost', costRoutes);
router.use('/alerts', alertRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

export default router;

