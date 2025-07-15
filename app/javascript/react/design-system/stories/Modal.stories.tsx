import React, { useState } from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { Modal, ModalProps } from '../organisms/Modal';
import { Button, Text } from '../atoms';

export default {
  title: 'Design System/Organisms/Modal',
  component: Modal,
} as Meta;

const Template: StoryFn<ModalProps> = (args) => {
  const [isOpen, setIsOpen] = useState(args.isOpen);

  // Allow storybook controls to toggle the modal
  React.useEffect(() => {
    setIsOpen(args.isOpen);
  }, [args.isOpen]);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <div>
      <Button onClick={handleOpen}>Open Modal</Button>
      <Modal
        {...args}
        isOpen={isOpen}
        onClose={handleClose}
        footer={
          <>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleClose}>Confirm</Button>
          </>
        }
      >
        <Text>This is the content of the modal. You can put any React nodes here.</Text>
      </Modal>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  isOpen: false,
  title: 'Default Modal',
};

export const InitiallyOpen = Template.bind({});
InitiallyOpen.args = {
  isOpen: true,
  title: 'Initially Open Modal',
};
