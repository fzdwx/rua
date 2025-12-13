/**
 * Hello Extension - Goodbye Command Script
 * 
 * This script is executed when the "Say Goodbye" action is triggered.
 */

export default function execute(api) {
  console.log('Goodbye from the extension! 👋');
  
  // Show a notification
  api.notification.show({
    title: 'Goodbye!',
    body: 'Thanks for using the Hello Extension!',
  }).catch(err => console.error('Failed to show notification:', err));
}
