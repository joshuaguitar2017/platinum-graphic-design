/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { Disabled, TextControl, Panel, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import icon from './icon.js';
import { name, title, category, description } from './block.json';

registerBlockType( name, {
	title: title,
	icon,
	category,
	description,
	attributes: {
		label: {
			type: 'string',
			default: __( 'Purchase Email Address', 'simple-pay' ),
		},
		buttonText: {
			type: 'string',
			default: __( 'Manage Subscriptions', 'simple-pay' ),
		},
		emailPlaceholder: {
			type: 'string',
			default: '',
		},
	},

	edit: ( { attributes, setAttributes } ) => {
		return (
			<div>
				<InspectorControls>
					<Panel>
						<PanelBody>
							<TextControl
								label={ __( 'Label', 'simple-pay' ) }
								value={ attributes.label }
								onChange={ ( value ) =>
									setAttributes( { label: value } )
								}
							/>

							<TextControl
								label={ __(
									'Email Placeholder',
									'simple-pay'
								) }
								value={ attributes.emailPlaceholder }
								onChange={ ( value ) =>
									setAttributes( { emailPlaceholder: value } )
								}
							/>
							<TextControl
								label={ __( 'Button Text', 'simple-pay' ) }
								value={ attributes.buttonText }
								onChange={ ( value ) =>
									setAttributes( { buttonText: value } )
								}
							/>
						</PanelBody>
					</Panel>
				</InspectorControls>

				<Disabled>
					<div className="simpay-subscription-management-form">
						<p className="simpay-subscription-management-email">
							<label htmlFor="simpay-ms-email">
								{ attributes.label }
							</label>
							<input
								type="email"
								id="simpay-ms-email"
								className="form-input-email"
								value={ attributes.email }
								placeholder={ attributes.emailPlaceholder }
								onChange={ ( value ) =>
									setAttributes( { email: value } )
								}
							/>
						</p>

						<p className="wp-block-button form-submit">
							<button className="wp-block-button__link wp-element-button">
								{ attributes.buttonText }
							</button>
						</p>
					</div>
				</Disabled>
			</div>
		);
	},

	save: () => null,
} );
