'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  INPUT_EMOTION,
  MeditationExpertise,
  MeditationForm,
  MeditationFormSchema,
  MeditationType,
  OUTPUT_EMOTION,
} from '@/models'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { submitForm } from './action'

export default function InputsForm({ username }: { username: string }) {
  const defaultValues: MeditationForm = {
    username,
    meditationExpertise: MeditationExpertise.BEGINNER,
    meditationType: MeditationType.SOUND,
    fromEmotion: INPUT_EMOTION.SAD,
    toEmotion: OUTPUT_EMOTION.JOY,
  }

  // const { toast } = useToast()

  async function onSubmit(data: MeditationForm) {
    try {
      console.log('Submitting', data)
      await submitForm(data)
    } catch (error) {
      console.error('Error submitting form', error)
      // toast({
      //   title: 'Error',
      //   description: 'Something went wrong!!!',
      //   variant: 'destructive',
      // })
    }
  }

  const form = useForm<MeditationForm>({
    resolver: zodResolver(MeditationFormSchema),
    defaultValues,
  })

  const meditationTypeEmojiMap = {
    [MeditationType.SOUND]: '🎶',
    [MeditationType.THOUGHT]: '💭',
    [MeditationType.FORM]: '🧘',
    [MeditationType.VISUALIZATION]: '👀',
    [MeditationType.NOTHINGNESS]: '🫙',
  }

  console.log(form.formState.errors)
  return (
    <div className="h-full w-full flex justify-center items-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex flex-col gap-4 justify-center rounded-lg p-6 border-2 border-gray-200"
        >
          <FormField
            control={form.control}
            name="fromEmotion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xl">
                  What are you feeling right now?
                </FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full text-lg font-medium">
                      <SelectValue placeholder="Emotion" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(INPUT_EMOTION).map((emotion) => (
                        <SelectItem
                          key={emotion}
                          value={emotion}
                          className="text-lg font-medium"
                        >
                          {emotion.charAt(0).toUpperCase() +
                            emotion.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toEmotion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xl">
                  What do you want to feel?
                </FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full text-lg font-medium">
                      <SelectValue placeholder="Emotion" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(OUTPUT_EMOTION).map((emotion) => (
                        <SelectItem
                          key={emotion}
                          value={emotion}
                          className="text-lg font-medium"
                        >
                          {emotion
                            .charAt(0)
                            .toUpperCase()
                            .concat(
                              emotion
                                .slice(1)
                                .toLowerCase()
                                .replaceAll('_', ' ')
                            )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meditationExpertise"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xl">
                  What is your meditation expertise?
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    defaultValue={MeditationExpertise.BEGINNER}
                    onValueChange={field.onChange}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={MeditationExpertise.BEGINNER}
                        id="option-one"
                      />
                      <Label
                        htmlFor="option-one"
                        className="text-lg font-medium"
                      >
                        Beginner
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={MeditationExpertise.ADVANCED}
                        id="option-two"
                      />
                      <Label
                        htmlFor="option-two"
                        className="text-lg font-medium"
                      >
                        Advanced
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meditationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xl">
                  What type of meditation do you want to do?
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    defaultValue={MeditationType.SOUND}
                    onValueChange={field.onChange}
                  >
                    {Object.values(MeditationType).map((type) => (
                      <div className="flex items-center space-x-2" key={type}>
                        <RadioGroupItem value={type} id={type} />
                        <Label htmlFor={type} className="text-lg font-medium">
                          {type
                            .charAt(0)
                            .toUpperCase()
                            .concat(
                              type.slice(1).toLowerCase().replaceAll('_', ' ')
                            )
                            .concat(` ${meditationTypeEmojiMap[type]}`)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            Submit
          </Button>
        </form>
      </Form>
    </div>
  )
}
