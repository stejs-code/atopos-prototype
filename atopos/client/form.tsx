import { component$, PropsOf } from '@builder.io/qwik'
export type FormProps = Omit<PropsOf<'form'>, 'action'> & {
  action: ':'
}
export const Form = component$<FormProps>((props) => {
  const { ...rest, action } = props

  return <form action="" preventdefault:submit {...rest}></form>
})
