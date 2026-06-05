/**
 * AURA AI - PC Control Frontend Module
 * J.A.R.V.I.S.-style PC Command & Control Center
 * 
 * Main entry point that exports all frontend components
 */

import SystemDashboard from './SystemDashboard';
import SystemGauge from './components/SystemGauge';
import ProcessList from './components/ProcessList';
import HardwarePanel from './components/HardwarePanel';
import QuickActions from './components/QuickActions';

export {
  SystemDashboard,
  SystemGauge,
  ProcessList,
  HardwarePanel,
  QuickActions,
};

// Default export: the main dashboard
export default SystemDashboard;